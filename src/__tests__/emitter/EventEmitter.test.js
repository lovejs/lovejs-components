const { Listener, EventEmitter, Event, errors } = require("components/emitter");
const { EmitterError } = errors;

const instance = new EventEmitter();
const testEventName = "test_event";
const testEventName2 = "test_event_2";

class ClassListener {
    constructor(stop, returning, fail) {
        this.stop = stop;
        this.returning = returning;
        this.fail = fail;
    }

    async method(event) {
        return Promise.delay(50).then(() => {
            if (this.fail) {
                throw new Error("Error");
            }

            if (this.stop) {
                event.stop();
            }

            return this.returning;
        });
    }
}

const FuncListener = (stop, returning) => event => {
    if (stop) {
        event.setStop();
    }

    return returning;
};

const method = "method";
const listeners = [
    { priority: 12, callable: FuncListener(false, "l1") },
    { priority: 4, callable: new ClassListener(false, "l2"), method },
    { priority: 16, callable: FuncListener(false, "l3") },
    { priority: 9, callable: new ClassListener(false, "l4"), method }
]
    .map(l => new Listener(l.priority, l.callable, l.method))
    .map((listener, idx) => {
        instance.addListener(testEventName, listener);
        if (idx < 2) {
            instance.addListener(testEventName2, listener);
        }
    });

test("Create instance of an Event Emitter", () => {
    expect(instance).toBeInstanceOf(EventEmitter);
});

test("addListener should only accepect Listener instance", () => {
    expect(() => instance.addListener(testEventName, "not_a_listener")).toThrowError(EmitterError);
});

test("Get all the listeners", () => {
    expect(instance.getListeners(testEventName).length).toBe(4);
    expect(instance.getListeners(testEventName2).length).toBe(2);
});

test("Listeners should be ordered by priority", () => {
    const listeners = instance.getListeners(testEventName);
    expect(listeners.length).toBe(4);

    expect(listeners[0].getPriority()).toBe(4);
    expect(listeners[1].getPriority()).toBe(9);
});

test("Emitting event should run listeners", async () => {
    return instance.emit(testEventName).then(event => {
        expect(event).toBeInstanceOf(Event);
        const expected = ["l2", "l4", "l1", "l3"];

        expect(event.getResults()).toEqual(expect.arrayContaining(expected));
    });
});

test("Emitting event without name should throw an error", () => {
    return instance.emit().catch(e => {
        expect(e).toBeInstanceOf(EmitterError);
    });
});

test("Emitting event shoud stop listeners chain if event has been stoped", async () => {
    instance.addListener(testEventName, new Listener(10, new ClassListener(true, "lstop"), method));

    return instance.emit(testEventName).then(event2 => {
        const expected = ["l2", "l4", "lstop"];
        expect(event2.getResults()).toEqual(expect.arrayContaining(expected));
    });
});

test("Emitter should populate rejects event if a listener reject", () => {
    instance.addListener(testEventName, new Listener(9, new ClassListener(true, "fail", true), method));

    return instance.emit(testEventName).then(event3 => {
        const expected = ["l2", "l4", "lstop"];
        expect(event3.getResults()).toEqual(expect.arrayContaining(expected));
        expect(event3.getRejects().length).toBe(1);
        expect(event3.getRejects()[0]).toBeInstanceOf(Error);
    });
});
