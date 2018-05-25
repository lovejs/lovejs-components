const { Event, Listener, errors, helpers } = require("components/emitter");
const ListenerError = errors.ListenerError;

const validEvent = new Event("event");

test("Create instances, getPriority, setPriority", () => {
    const instance = new Listener(10, jest.fn());
    expect(instance.getPriority()).toBe(10);
    instance.setPriority(12);
    expect(instance.getPriority()).toBe(12);
});

test("Create instance with listener() helper", () => {
    expect(helpers.listener(10, jest.fn())).toBeInstanceOf(Listener);
});

test("Create instances of a Listener with a handler function", () => {
    const instance = new Listener(10, jest.fn());
    expect(instance).toBeInstanceOf(Listener);
});

test("Create instances of a Listener with a class and method", () => {
    class C {
        m() {}
    }
    const instance = new Listener(10, new C(), "m");
    expect(instance).toBeInstanceOf(Listener);
});

test("Handle should fail if no handler has been set", () => {
    const instance = new Listener(10);
    return instance.handle(new Event()).catch(e => {
        expect(e).toBeInstanceOf(ListenerError);
    });
});

test("Handle should fail if no Event instance of is received", () => {
    const instance = new Listener(10, jest.fn());
    return instance.handle("not_an_event").catch(e => {
        expect(e).toBeInstanceOf(ListenerError);
    });
});

test("Handle should call handler function", () => {
    const handler = jest.fn();
    const instance = new Listener(10, handler);
    instance.handle(validEvent).then(() => {
        expect(handler).toHaveBeenCalled();
    });
});

test("Handle should call class method", () => {
    const f = jest.fn();
    class C {
        m() {
            return f();
        }
    }

    const instance = new Listener(10, new C(), "m");
    return instance.handle(validEvent).then(() => {
        expect(f).toHaveBeenCalled();
    });
});

test("setHandler should failed if handler is invalid", () => {
    const instance = new Listener(10);
    class C {}

    expect(() => instance.setHandler()).toThrowError(ListenerError);
    expect(() => instance.setHandler(null, [])).toThrowError(ListenerError);
    expect(() => instance.setHandler(null, "dd")).toThrowError(ListenerError);
    expect(() => instance.setHandler(new C(), "not_found")).toThrowError(ListenerError);
    expect(() => instance.setHandler(new C())).toThrowError(ListenerError);
});
