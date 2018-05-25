import _ from "lodash";
const {
    Container,
    Definitions: { Arguments, Argument, Call, Configurator, Factory, Service, Tag },
    Resolution,
    errors
} = require("components/di");
const { DiResolutionError } = errors;

const getService = () => {
    return new Service(() => () => "a_service");
};

class aServiceClass {
    method() {
        return "service_class";
    }
}

const aServiceFunc = () => () => "service_function";
const aServiceFunc2 = () => () => "service_function_2";

test("Create instance of an Container", () => {
    const container = new Container();
    expect(container).toBeInstanceOf(Container);
});

test("Loading services should use the loader to create services", () => {
    const load = jest.fn().mockReturnValue({ parameters: {}, services: {} });
    const fakeLoader = {
        load
    };
    const container = new Container({ loader: fakeLoader });
    container.loadDefinitions({});
    expect(load).toHaveBeenCalled();
});

test("getService, setService should get / set a service", () => {
    const container = new Container();
    const service1 = new Service(() => true);
    const service2 = new Service(() => false);

    container.setService("service1", service1);
    expect(container.getService("service1")).toBe(service1);
    expect(container.getServices()).toMatchObject({ service1 });
    expect(container.getServicesIds()).toEqual(expect.arrayContaining(["service1"]));

    container.setServices({
        service1,
        service2
    });

    expect(container.getService("service2")).toBe(service2);
    expect(container.getServices()).toMatchObject({ service1, service2 });
    expect(container.getServicesIds()).toEqual(expect.arrayContaining(["service1", "service2"]));
});

test("getServices should return list of services (filtered)", () => {
    const container = new Container();
    const filter1 = { tag: "tag.text" };
    const filter2 = { tag: "tag.unknow" };
    const service1 = new Service(aServiceFunc);
    const service2 = new Service(aServiceFunc);
    service2.addTag(new Tag("tag.text"));

    container.setService("service1", service1);
    container.setService("service2", service2);

    expect(container.getServices(filter1)).toMatchObject({ service2 });
    expect(container.getServices(filter2)).toMatchObject({});

    expect(container.getServicesIds(filter1)).toEqual(expect.arrayContaining(["service2"]));
    expect(container.getServicesIds(filter2)).toEqual(expect.arrayContaining([]));
});

test("getServicesTags should return a list of {id, service, tag}", () => {
    const container = new Container();
    const service = new Service(aServiceFunc);
    const tag = new Tag("tag.text", { att1: "val1", att2: "val2" });
    service.addTag(tag);
    container.setService("serviceId", service);

    const res = container.getServicesTags("tag.text");
    expect(res[0]).toBeDefined();
    expect(res[0]).toMatchObject({ id: "serviceId", service, tag });
});

test("getParameter / setParameter should get and set a parameter", () => {
    const container = new Container();
    container.setParameter("p1", "val1");
    expect(container.getParameter("p1")).toBe("val1");
    expect(container.getParameter("unknow")).toBeUndefined();
    container.setParameter("p2", "val2");
    expect(container.getParameters()).toMatchObject({ p1: "val1", p2: "val2" });
});

test("getting default argument resolvers", () => {
    const container = new Container();
    const types = ["default", "service", "parameter", "services"];
    _.each(types, type => {
        expect(container.getArgumentResolver(type)).toBeDefined();
    });

    expect(() => container.getArgumentResolver("invalid")).toThrowError(Error);
});

test("Declaring and getting a simple 'function' service", () => {
    const container = new Container();
    const funcService = new Service(aServiceFunc);

    container.setService("service_function", funcService.setPublic(true));

    return container.get("service_function").then(service => {
        expect(service()).toBe("service_function");
    });
});

test("Declaring and getting a simple 'class' service", () => {
    const container = new Container();
    const classService = new Service(aServiceClass);

    expect(classService.getModule()).toBe(aServiceClass);

    container.setService("simple", classService.setPublic(true));

    return container.get("simple").then(service => {
        expect(service).toBeInstanceOf(aServiceClass);
        expect(service.method()).toBe("service_class");
    });
});

test("Getting unknow service should raise an error", () => {
    const container = new Container();
    container.get("unknow").then(
        () => {
            throw new Error("Service resolution with unknow service should have failed");
        },
        e => {
            expect(e).toBeInstanceOf(DiResolutionError);
        }
    );
});

test("Service not shared - create new instance", () => {
    const container = new Container();
    const funcService = new Service(() => () => true);
    funcService.setShared(false);
    container.setService("service", funcService.setPublic(true));

    return container.get("service").then(service => {
        return container.get("service").then(service2 => {
            expect(service2).not.toBe(service);
        });
    });
});

test("Service shared - resolve with same instance", () => {
    const container = new Container();
    const funcService = new Service(() => () => true);
    container.setService("service", funcService.setShared(true).setPublic(true));

    return container.get("service").then(service => {
        return container.get("service").then(service2 => {
            expect(service2).toBe(service);
        });
    });
});

class aServiceClassForFactory {
    constructor(arg) {
        this.arg = arg;
    }

    getArg() {
        return this.arg;
    }
}

test("Service from factory (factory as a function service)", () => {
    const container = new Container();
    const factory = new Service(() => arg => {
        const s = new aServiceClassForFactory(arg);
        return s;
    });
    const service = new Service();
    service.setFactory(new Factory("service_factory"));
    service.setArgs([new Argument("default", "test")]);
    container.setService("service_factory", factory);
    container.setService("service", service.setPublic(true));

    return container.get("service").then(s => {
        expect(s.getArg()).toBe("test");
    });
});

class aFactory {
    getMyService(arg) {
        return new aServiceClassForFactory(arg);
    }
}

test("Service from factory (factory as a class service)", () => {
    const container = new Container();
    const factory = new Service(aFactory);
    const service = new Service();
    service.setFactory(new Factory("service_factory", "getMyService"));
    service.setArgs([new Argument("default", "test")]);
    container.setService("service_factory", factory);
    container.setService("service", service.setPublic(true));

    return container.get("service").then(s => {
        expect(s.getArg()).toBe("test");
    });
});

test("Service from factory should failed if factory method is not defined", () => {
    const container = new Container();
    const factory = new Service(aFactory);
    const service = new Service();
    service.setFactory(new Factory("service_factory", "aUnknowMethod"));
    service.setArgs([new Argument("default", "test")]);
    container.setService("service_factory", factory);
    container.setService("service", service.setPublic(true));

    return container.get("service").then(
        s => {
            throw new Error("Service resolution with bad method should have failed");
        },
        e => {
            expect(e).toBeInstanceOf(DiResolutionError);
        }
    );
});

test("Service shared - concurrent resolution should resolve the same instance", () => {
    const container = new Container();
    const factory = new Service(() => () => Promise.delay(300).then(() => new aServiceClassForFactory("test")));
    const service = new Service();
    service.setShared(true);
    service.setFactory(new Factory("service_factory"));

    container.setService("service_factory", factory);
    container.setService("service", service.setPublic(true));

    return Promise.all([container.get("service"), container.get("service")]).then(res => {
        expect(res.length).toBe(2);
        expect(res[0]).toBe(res[1]);
    });
});

test("Argument resolver : parameter", () => {
    const container = new Container();
    container.setParameter("param1", "value1");

    const arg = new Argument("parameter", "param1");

    return container.resolveArgument(arg).then(resolved => {
        expect(resolved).toBe("value1");
    });
});

test("Argument resolver : service", () => {
    const container = new Container();
    const resolution = new Resolution();
    const service = new Service(aServiceClass);
    container.setService("service1", service.setPublic(true));

    const arg = new Argument("service", "service1");

    return container.resolveArgument(arg, resolution).then(resolved => {
        expect(resolved).toBeInstanceOf(aServiceClass);
    });
});

test("Argument resolver : services", () => {
    const container = new Container();
    const resolution = new Resolution();
    const service1 = new Service(aServiceClass);
    const service2 = new Service(aServiceClass);
    service2.addTag(new Tag("atag"));
    const service3 = new Service(aServiceClass);

    container.setService("service1", service1);
    container.setService("service2", service2.setPublic(true));
    container.setService("service3", service3);

    const arg = new Argument("services", { tag: "atag" });

    return container.get("service2").then(s2instance => {
        return container.resolveArgument(arg, resolution).then(resolved => {
            expect(resolved).toEqual(expect.arrayContaining([s2instance]));
        });
    });
});

test("Argument resolver : default : with array", () => {
    const container = new Container();
    const service1 = new Service(aServiceClass);
    container.setService("service1", service1);
    container.setParameter("param1", "value_param1");

    const resolution = new Resolution();
    const arg = new Argument("default", [new Argument("service", "service1"), "nothing", new Argument("parameter", "param1")]);

    return container.resolveArgument(arg, resolution).then(resolved => {
        expect(resolved.length).toBe(3);
        expect(resolved[0]).toBeInstanceOf(aServiceClass);
        expect(resolved[1]).toBe("nothing");
        expect(resolved[2]).toBe("value_param1");
    });
});

test("Argument resolver : default : with object", () => {
    const container = new Container();
    const service1 = new Service(aServiceClass);
    container.setService("service1", service1);
    container.setParameter("param1", "value_param1");

    const resolution = new Resolution();
    const arg = new Argument("default", {
        a: new Argument("service", "service1"),
        b: ["a", "b", "c", "d", new Argument("parameter", "param1")],
        c: new Argument("parameter", "param1")
    });

    return container.resolveArgument(arg, resolution).then(resolved => {
        expect(resolved.a).toBeInstanceOf(aServiceClass);
        expect(resolved.b).toEqual(expect.arrayContaining(["a", "b", "c", "d", "value_param1"]));
        expect(resolved.c).toBe("value_param1");
    });
});

test("Argument resolver : default : with other", () => {
    const container = new Container();
    const resolution = new Resolution();
    const arg = new Argument("default", "value");

    return container.resolveArgument(arg, resolution).then(resolved => {
        expect(resolved).toBe("value");
    });
});

test("Arguments resolver", () => {
    const container = new Container();
    const resolution = new Resolution();
    const service1 = new Service(aServiceClass);
    container.setService("service1", service1);
    container.setParameter("param1", "value_param1");

    const args = new Arguments([new Argument("service", "service1"), new Argument("parameter", "param1")]);

    return container.resolveArguments(args, resolution).then(resolved => {
        expect(resolved.length).toBe(2);
        expect(resolved[0]).toBeInstanceOf(aServiceClass);
        expect(resolved[1]).toBe("value_param1");
    });
});

test("Arguments resolver should failed if not Arguments instance", () => {
    const container = new Container();
    const resolution = new Resolution();

    return container.resolveArguments("not_arguments_instance", resolution).then(
        () => {
            throw new Error("Arguments resolver should have failed if called with not instance of Arguments");
        },
        e => {
            expect(e).toBeInstanceOf(DiResolutionError);
        }
    );
});

class aServiceClass3 {
    constructor() {
        this.methods = [];
    }

    method1() {
        this.methods.push("1");
    }

    method2() {
        this.methods.push("2");
    }

    method3() {
        this.methods.push("3");
    }

    order() {
        return this.methods;
    }
}

test("Services calls", () => {
    const container = new Container();
    const resolution = new Resolution();

    const service = new Service(aServiceClass3);
    service.addCall(new Call("method2"));
    service.addCall(new Call("method3"));
    service.addCall(new Call("method1"));

    container.setService("service1", service.setPublic(true));

    return container.get("service1").then(s => {
        expect(s.order()).toEqual(expect.arrayContaining(["2", "3", "1"]));
    });
});

test("Services calls fail cause invalid method", () => {
    const container = new Container();
    const resolution = new Resolution();

    const service = new Service(aServiceClass3);
    service.addCall(new Call("unknow_method"));

    container.setService("service1", service);

    return container.get("service1").then(
        s => s,
        e => {
            expect(e).toBeInstanceOf(DiResolutionError);
        }
    );
});

test("Service alias simple", () => {
    const container = new Container();

    const service = new Service(aServiceClass);
    const serviceAlias = new Service();
    serviceAlias.setAlias("service").setPublic(true);

    container.setService("service", service);
    container.setService("service_alias", serviceAlias);

    return container.get("service_alias").then(s => {
        expect(s).toBeInstanceOf(aServiceClass);
    });
});

test("Service alias of alias", () => {
    const container = new Container();

    const service = new Service(aServiceClass);
    const serviceAlias1 = new Service();
    const serviceAlias2 = new Service();
    const serviceAlias3 = new Service();
    const serviceAlias4 = new Service();
    serviceAlias1.setAlias("service").setPublic(true);
    serviceAlias2.setAlias("alias1").setPublic(true);
    serviceAlias3.setAlias("alias2").setPublic(true);
    serviceAlias4.setAlias("alias3").setPublic(true);

    container.setService("service", service);
    container.setService("alias1", serviceAlias1);
    container.setService("alias2", serviceAlias2);
    container.setService("alias3", serviceAlias3);
    container.setService("alias4", serviceAlias4);

    return container.get("alias4").then(s => {
        expect(s).toBeInstanceOf(aServiceClass);
    });
});

test("Service alias cyclic faild", () => {
    const container = new Container();

    const serviceAlias1 = new Service();
    const serviceAlias2 = new Service();

    serviceAlias1.setAlias("alias2").setPublic(true);
    serviceAlias2.setAlias("alias1").setPublic(true);

    container.setService("alias1", serviceAlias1);
    container.setService("alias2", serviceAlias2);

    return container.get("alias1").then(
        s => s,
        e => {
            expect(e).toBeInstanceOf(DiResolutionError);
        }
    );
});

test("Service using parent definition", () => {});

class aServiceClassForConfigurator {
    configureService(service) {
        service.setConfigured(true);
    }
}

class aServiceClassConfigured {
    constructor() {
        this.configured = false;
    }

    setConfigured(configured) {
        this.configured = configured;
    }

    isConfigured() {
        return this.configured;
    }
}

test("Service using configurator", () => {
    const container = new Container();

    const configurator = new Service(aServiceClassForConfigurator);
    const service = new Service(aServiceClassConfigured);
    service.setConfigurator(new Configurator("configurator", "configureService"));

    container.setService("service1", service.setPublic(true));
    container.setService("configurator", configurator);

    return container.get("service1").then(s => {
        expect(s.isConfigured()).toBe(true);
    });
});

test("Service using decorator", () => {});

test("Definition should set the parentId if parent is present", () => {
    const parent = {
        module: "dady",
        args: ["dep1", "dep2"],
        tags: ["t1"],
        calls: [{ method: "test" }],
        shared: true,
        preloaded: true,
        autowired: true
    };

    const child = {
        parent: "parent",
        args: {
            1: "dep_override"
        }
    };
    expect.assertions(5);
    return instance
        .load({
            services: {
                parent,
                child
            }
        })
        .then(() => {
            const services = instance.getServices();
            const childService = services.child;
            const childArgs = childService.getArgs();

            expect(childService.getModule()).toBe("dady");
            expect(childArgs.get(0)).toBeInstanceOf(Argument);
            expect(childArgs.get(0).getValue()).toBe("dep1");
            expect(childArgs.get(1)).toBeInstanceOf(Argument);
            expect(childArgs.get(1).getValue()).toBe("dep_override");
        });
});
