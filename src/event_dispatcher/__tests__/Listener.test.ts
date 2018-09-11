import { Event, Listener, ListenerError } from "..";

const validEvent = new Event("event");

describe("#Event Dispatcher [Listener]", function() {
    it("Create instances, getPriority, setPriority", () => {
        const instance = new Listener(jest.fn(), 10);
        expect(instance.getPriority()).toBe(10);
        instance.setPriority(12);
        expect(instance.getPriority()).toBe(12);
    });

    it("Create instances of a Listener with a handler function", () => {
        const instance = new Listener(jest.fn(), 10);
        expect(instance).toBeInstanceOf(Listener);
    });

    it("Create instances of a Listener with a class and method", () => {
        class C {
            m() {}
        }
        const instance = new Listener(new C(), 10, "m");
        expect(instance).toBeInstanceOf(Listener);
    });

    it("Handle should fail if no handler has been set", () => {
        const instance = new Listener(undefined, 10);
        return instance.handle(new Event("test")).catch(e => {
            expect(e).toBeInstanceOf(ListenerError);
        });
    });

    it("Handle should fail if no Event instance of is received", () => {
        const instance = new Listener(jest.fn(), 10);
        return instance.handle("not_an_event").catch(e => {
            expect(e).toBeInstanceOf(ListenerError);
        });
    });

    it("Handle should call handler function", () => {
        const handler = jest.fn();
        const instance = new Listener(handler, 10);
        instance.handle(validEvent).then(() => {
            expect(handler).toHaveBeenCalled();
        });
    });

    it("Handle should call class method", () => {
        const f = jest.fn();
        class C {
            m() {
                return f();
            }
        }

        const instance = new Listener(new C(), 10, "m");
        return instance.handle(validEvent).then(() => {
            expect(f).toHaveBeenCalled();
        });
    });

    it("setHandler should failed if handler is invalid", () => {
        const instance = new Listener(undefined, 10);
        class C {}

        // @ts-ignore
        expect(() => instance.setHandler()).toThrowError(ListenerError);
        expect(() => instance.setHandler(null, [])).toThrowError(ListenerError);
        expect(() => instance.setHandler(null, "dd")).toThrowError(ListenerError);
        expect(() => instance.setHandler(new C(), "not_found")).toThrowError(ListenerError);
        // @ts-ignore
        expect(() => instance.setHandler(new C())).toThrowError(ListenerError);
    });
});
