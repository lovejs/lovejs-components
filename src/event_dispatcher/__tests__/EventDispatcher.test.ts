import { Listener, EventDispatcher, Event, EmitterError } from "..";
import * as Bluebird from "bluebird";

const testEventName = "test_event";
const testEventName2 = "test_event_2";

class ClassListener {
    protected stop: boolean;
    protected returning: any;
    protected fail: boolean;

    constructor(stop: boolean, returning: any, fail?: boolean) {
        this.stop = stop;
        this.returning = returning;
        this.fail = fail;
    }

    async method(event) {
        await Bluebird.delay(50);
        if (this.fail) {
            throw new Error("Error");
        }

        if (this.stop) {
            event.stop();
        }

        return this.returning;
    }
}

const FuncListener = (stop, returning) => event => {
    if (stop) {
        event.setStop();
    }

    return returning;
};
const method = "method";
const getInstance = () => {
    const instance = new EventDispatcher();

    const listeners = [
        { priority: 12, callable: FuncListener(false, "l1") },
        { priority: 4, callable: new ClassListener(false, "l2"), method },
        { priority: 16, callable: FuncListener(false, "l3") },
        { priority: 9, callable: new ClassListener(false, "l4"), method }
    ]
        .map(l => new Listener(l.callable, l.priority, l.method))
        .map((listener, idx) => {
            instance.addListener(testEventName, listener);
            if (idx < 2) {
                instance.addListener(testEventName2, listener);
            }
        });
    return instance;
};

describe("#Event Dispatcher [Event Dispatcher]", function() {
    it("Create instance of an Event Emitter", () => {
        expect(getInstance()).toBeInstanceOf(EventDispatcher);
    });

    it("addListener should only accept Listener instance", () => {
        const instance = getInstance();
        // @ts-ignore
        expect(() => instance.addListener(testEventName, "not_a_listener")).toThrowError(EmitterError);
    });

    it("Get all the listeners", () => {
        const instance = getInstance();
        expect(instance.getListeners(testEventName).length).toBe(4);
        expect(instance.getListeners(testEventName2).length).toBe(2);
    });

    it("Listeners should be ordered by priority", () => {
        const instance = getInstance();
        const listeners = instance.getListeners(testEventName);
        expect(listeners.length).toBe(4);

        expect(listeners[0].getPriority()).toBe(4);
        expect(listeners[1].getPriority()).toBe(9);
    });

    it("Emitting event should run listeners", async () => {
        const instance = getInstance();
        const event = await instance.emit(testEventName);
        expect(event).toBeInstanceOf(Event);
        const expected = ["l2", "l4", "l1", "l3"];

        expect(event.getResults()).toEqual(expect.arrayContaining(expected));
    });

    it("Emitting event without name should throw an error", () => {
        const instance = getInstance();
        // @ts-ignore
        return instance.emit().catch(e => {
            expect(e).toBeInstanceOf(EmitterError);
        });
    });

    it("Emitting event shoud stop listeners chain if event has been stoped", async () => {
        const instance = getInstance();
        instance.addListener(testEventName, new Listener(new ClassListener(true, "lstop"), 10, method));
        console.log(instance.getListeners(testEventName));
        const event = await instance.emit(testEventName);
        const expected = ["l2", "l4", "lstop"];
        expect(event.getResults()).toEqual(expect.arrayContaining(expected));
    });

    it("Emitter should populate rejects event if a listener reject", async () => {
        const instance = getInstance();
        instance.addListener(testEventName, new Listener(new ClassListener(true, "fail", true), 9, method));

        const event3 = await instance.emit(testEventName);
        const expected = ["l2", "l4"];
        expect(event3.getResults()).toEqual(expect.arrayContaining(expected));
        expect(event3.getRejects().length).toBe(1);
        expect(event3.getRejects()[0]).toBeInstanceOf(Error);
    });
});
