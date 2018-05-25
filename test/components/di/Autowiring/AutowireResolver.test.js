const { Definitions: { Argument, Arguments }, Autowiring: { AutowireResolver } } = require("components/di");
const { parametersExtracter } = require("components/reflection");

const resolver = new AutowireResolver(parametersExtracter);

test("Should resolve as Arguments instance", () => {
    const fun1 = p1 => true;
    const resolved = resolver.resolve(fun1);
    expect(resolved).toBeInstanceOf(Arguments);
});

const resolvedFirst = target => {
    const resolved = resolver.resolve(target);
    return resolved.get(0);
};

const expectArgument = (arg, type, value) => {
    expect(arg).toBeInstanceOf(Argument);
    expect(arg.getType()).toBe(type);
    expect(arg.getValue()).toBe(value);
};

const expectService = (target, service) => {
    expectArgument(resolvedFirst(target), "service", service);
};

test('Resolve args function(p1) to _service("p1")', () => {
    const fun1 = p1 => true;
    expectService(fun1, "p1");
});

test('Resolve args function(p1) to _service("p1")', () => {
    const fun1 = (p1 = "service1") => true;
    expectService(fun1, "service1");
});

test('Resolve args function({p1}) to {p1: _service("p1")}', () => {
    const fun1 = ({ p1 }) => true;
    const res = resolvedFirst(fun1);

    expectArgument(res.p1, "service", "p1");
});

test('Resolve args function({"myservice": p1}) to {myservice: _service("myservice")}', () => {
    const fun1 = ({ myservice: p1 }) => true;
    const res = resolvedFirst(fun1);

    expectArgument(res.myservice, "service", "myservice");
});

test("Resolve args function([p1, p2 = s2]) to [p1, s2]", () => {
    const fun1 = ([p1, p2 = "s2"]) => true;
    const res = resolvedFirst(fun1);

    expectArgument(res[0], "service", "p1");
    expectArgument(res[1], "service", "s2");
});

/*
test("Service autowired simple", () => {
    const container = new Container();
    const resolution = new Resolution();
    class aServiceClass2 {
        constructor(service2, _param1_, service3) {
            this.service2 = service2;
            this.param1 = _param1_;
            this.service3 = service3;
        }

        retrieve() {
            return [this.service2(), this.param1, this.service3()];
        }
    }
    const service1 = new Service(aServiceClass2);
    service1.setAutowired(true);
    container.setService("service1", service1.setPublic(true));
    container.setParameter("param1", "value_param1");
    container.setService("service2", new Service(aServiceFunc));
    container.setService("service3", new Service(aServiceFunc2));

    return container.get("service1").then(service => {
        const retrieve = service.retrieve();
        expect(retrieve.length).toBe(3);
        expect(retrieve[0]).toBe("service_function");
        expect(retrieve[1]).toBe("value_param1");
        expect(retrieve[2]).toBe("service_function_2");
    });
});

test("Service autowired complex", () => {
    const container = new Container();
    const resolution = new Resolution();
    class aServiceClass6 {
        constructor({ service2, service3, ...rest }) {
            this.service2 = service2;
            this.service3 = service3;
            this.rest = rest;
        }

        retrieve() {
            return [this.service2(), this.service3(), this.rest];
        }
    }

    // console.log(getParametersNames(aServiceClass6));

    const service1 = new Service(aServiceClass6);
    service1.setAutowired(true);
    container.setService("service1", service1.setPublic(true));
    container.setParameter("param1", "value_param1");
    container.setService("service2", new Service(aServiceFunc));
    container.setService("service3", new Service(aServiceFunc2));

    return container.get("service1").then(service => {
        const retrieve = service.retrieve();
        expect(retrieve.length).toBe(3);
        expect(retrieve[0]).toBe("service_function");
        expect(retrieve[1]).toBe("value_param1");
        expect(retrieve[2]).toBe("service_function_2");
    });
});

test("Service autowired + args", () => {});
*/
