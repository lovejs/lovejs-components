import * as _ from "lodash";
import * as Promise from "bluebird";

import { Resolution, Container, Argument, Arguments, Call, Configurator, Factory, Service, Tag, DiResolutionError } from "../..";

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

describe("#DI [Container]", function() {
    it("Create instance of an Container", () => {
        const container = new Container();
        expect(container).toBeInstanceOf(Container);
    });

    it("Loading services should use the loader to create services", () => {
        const load = jest.fn().mockReturnValue({ parameters: {}, services: {} });
        const fakeLoader = { load };
        const container = new Container({ definitionsLoader: fakeLoader });
        container.loadDefinitions({});
        expect(load).toHaveBeenCalled();
    });

    it("getService, setService should get / set a service", () => {
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

    it("getServices should return list of services (filtered)", () => {
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

    it("getServicesTags should return a list of {id, service, tag}", () => {
        const container = new Container();
        const service = new Service(aServiceFunc);
        const tag = new Tag("tag.text", { att1: "val1", att2: "val2" });
        service.addTag(tag);
        container.setService("serviceId", service);

        const res = container.getServicesTags("tag.text");
        expect(res[0]).toBeDefined();
        expect(res[0]).toMatchObject({ id: "serviceId", service, tag });
    });

    it("getParameter / setParameter should get and set a parameter", () => {
        const container = new Container();
        container.setParameter("p1", "val1");
        expect(container.getParameter("p1")).toBe("val1");
        expect(container.getParameter("unknow")).toBeUndefined();
        container.setParameter("p2", "val2");
        expect(container.getParameters()).toMatchObject({ p1: "val1", p2: "val2" });
    });

    it("getting default argument resolvers", () => {
        const container = new Container();
        const types = ["default", "service", "parameter", "services"];
        _.each(types, type => {
            expect(container.getArgumentResolver(type)).toBeDefined();
        });

        expect(() => container.getArgumentResolver("invalid")).toThrowError(Error);
    });

    it("Declaring and getting a simple 'function' service", async () => {
        const container = new Container();
        const funcService = new Service(aServiceFunc);

        container.setService("service_function", funcService.setPublic(true));
        const resolved = await container.get("service_function");
        expect(resolved()).toBe("service_function");
    });

    it("Declaring and getting a simple 'class' service", async () => {
        const container = new Container();
        const classService = new Service(aServiceClass);

        expect(classService.getModule()).toBe(aServiceClass);

        container.setService("simple", classService.setPublic(true));
        const resolved = await container.get("simple");
        expect(resolved).toBeInstanceOf(aServiceClass);
        expect(resolved.method()).toBe("service_class");
    });

    it("Getting unknow service should raise an error", async () => {
        const container = new Container();
        const resolve = async () => await container.get("unknow");
        await expect(resolve()).rejects.toThrow(DiResolutionError);
    });

    it("Service not shared - create new instance", async () => {
        const container = new Container();
        const funcService = new Service(() => () => true);
        funcService.setShared(false);
        container.setService("service", funcService.setPublic(true));

        const service = await container.get("service");
        const service2 = await container.get("service");
        expect(service2).not.toBe(service);
    });

    it("Service shared - resolve with same instance", async () => {
        const container = new Container();
        const funcService = new Service(() => () => true);
        container.setService("service", funcService.setShared(true).setPublic(true));

        const service = await container.get("service");
        const service2 = await container.get("service");
        expect(service2).toBe(service);
    });

    class aServiceClassForFactory {
        protected arg: any;
        constructor(arg) {
            this.arg = arg;
        }

        getArg() {
            return this.arg;
        }
    }

    it("Service from factory (factory as a function service)", async () => {
        const container = new Container();
        const factory = new Service(() => arg => {
            const s = new aServiceClassForFactory(arg);
            return s;
        });
        const service = new Service();
        service.setFactory(new Factory("service_factory"));
        service.setArgs(new Arguments([new Argument("default", "test")]));
        container.setService("service_factory", factory);
        container.setService("service", service.setPublic(true));

        const resolved = await container.get("service");
        expect(resolved.getArg()).toBe("test");
    });

    class aFactory {
        getMyService(arg) {
            return new aServiceClassForFactory(arg);
        }
    }

    it("Service from factory (factory as a class service)", async () => {
        const container = new Container();
        const factory = new Service(aFactory);
        const service = new Service();
        service.setFactory(new Factory("service_factory", "getMyService"));
        service.setArgs(new Arguments([new Argument("default", "test")]));
        container.setService("service_factory", factory);
        container.setService("service", service.setPublic(true));

        const resolved = await container.get("service");
        expect(resolved.getArg()).toBe("test");
    });

    it("Service from factory should failed if factory method is not defined", async () => {
        const container = new Container();
        const factory = new Service(aFactory);
        const service = new Service();
        service.setFactory(new Factory("service_factory", "aUnknowMethod"));
        service.setArgs(new Arguments([new Argument("default", "test")]));
        container.setService("service_factory", factory);
        container.setService("service", service.setPublic(true));

        const resolve = async () => await container.get("service");
        await expect(resolve()).rejects.toThrow(DiResolutionError);
    });

    it("Service shared - concurrent resolution should resolve the same instance", async () => {
        const container = new Container();
        const factory = new Service(() => () => Promise.delay(300).then(() => new aServiceClassForFactory("test")));
        const service = new Service();
        service.setShared(true);
        service.setFactory(new Factory("service_factory"));

        container.setService("service_factory", factory);
        container.setService("service", service.setPublic(true));

        const res = await Promise.all([container.get("service"), container.get("service")]);
        expect(res.length).toBe(2);
        expect(res[0]).toBe(res[1]);
    });

    it("Argument resolver : parameter", async () => {
        const container = new Container();
        container.setParameter("param1", "value1");

        const arg = new Argument("parameter", "param1");

        const resolved = await container.resolveArgument(arg);
        expect(resolved).toBe("value1");
    });

    it("Argument resolver : service", async () => {
        const container = new Container();
        const service = new Service(aServiceClass);
        container.setService("service1", service.setPublic(true));

        const arg = new Argument("service", "service1");
        const res = await container.resolveArgument(arg, new Resolution("test"));

        expect(res).toBeInstanceOf(aServiceClass);
    });

    it("Argument resolver : services", async () => {
        const container = new Container();
        const service1 = new Service(aServiceClass);
        const service2 = new Service(aServiceClass);
        service2.addTag(new Tag("atag"));
        const service3 = new Service(aServiceClass);

        container.setService("service1", service1);
        container.setService("service2", service2.setPublic(true));
        container.setService("service3", service3);

        const arg = new Argument("services", { tag: "atag" });

        const s2instance = await container.get("service2");
        const resolved = await container.resolveArgument(arg, new Resolution("test"));
        expect(resolved).toEqual(expect.arrayContaining([s2instance]));
    });

    it("Argument resolver : default : with array", async () => {
        const container = new Container();
        const service1 = new Service(aServiceClass);
        container.setService("service1", service1);
        container.setParameter("param1", "value_param1");

        const arg = new Argument("default", [new Argument("service", "service1"), "nothing", new Argument("parameter", "param1")]);

        const resolved = await container.resolveArgument(arg, new Resolution("test"));

        expect(resolved.length).toBe(3);
        expect(resolved[0]).toBeInstanceOf(aServiceClass);
        expect(resolved[1]).toBe("nothing");
        expect(resolved[2]).toBe("value_param1");
    });

    it("Argument resolver : default : with object", async () => {
        const container = new Container();
        const service1 = new Service(aServiceClass);
        container.setService("service1", service1);
        container.setParameter("param1", "value_param1");

        const arg = new Argument("default", {
            a: new Argument("service", "service1"),
            b: ["a", "b", "c", "d", new Argument("parameter", "param1")],
            c: new Argument("parameter", "param1")
        });

        const resolved = await container.resolveArgument(arg, new Resolution("test"));
        expect(resolved.a).toBeInstanceOf(aServiceClass);
        expect(resolved.b).toEqual(expect.arrayContaining(["a", "b", "c", "d", "value_param1"]));
        expect(resolved.c).toBe("value_param1");
    });

    it("Argument resolver : default : with other", async () => {
        const container = new Container();
        const arg = new Argument("default", "value");

        const resolved = await container.resolveArgument(arg, new Resolution("test"));
        expect(resolved).toBe("value");
    });

    it("Arguments resolver", async () => {
        const container = new Container();
        const service1 = new Service(aServiceClass);
        container.setService("service1", service1);
        container.setParameter("param1", "value_param1");

        const args = new Arguments([new Argument("service", "service1"), new Argument("parameter", "param1")]);

        const resolved = await container.resolveArguments(args, new Resolution("test"));
        expect(resolved.length).toBe(2);
        expect(resolved[0]).toBeInstanceOf(aServiceClass);
        expect(resolved[1]).toBe("value_param1");
    });

    it("Arguments resolver should failed if not Arguments instance", async () => {
        const container = new Container();

        // @ts-ignore
        return container.resolveArguments("not_arguments_instance", new Resolution("test")).then(
            () => {
                throw new Error("Arguments resolver should have failed if called with not instance of Arguments");
            },
            e => {
                expect(e).toBeInstanceOf(DiResolutionError);
            }
        );
    });

    class aServiceClass3 {
        protected methods: string[];

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

    it("Services calls", async () => {
        const container = new Container();

        const service = new Service(aServiceClass3);
        service.addCall(new Call("method2"));
        service.addCall(new Call("method3"));
        service.addCall(new Call("method1"));

        container.setService("service1", service.setPublic(true));

        const resolved = await container.get("service1");
        expect(resolved.order()).toEqual(expect.arrayContaining(["2", "3", "1"]));
    });

    it("Services calls fail cause invalid method", async () => {
        const container = new Container();

        const service = new Service(aServiceClass3);
        service.setPublic(true);
        service.addCall(new Call("unknow_method"));

        container.setService("service1", service);

        const resolve = async () => await container.get("service1");
        await expect(resolve()).rejects.toThrow(DiResolutionError);
    });

    it("Service alias simple", async () => {
        const container = new Container();

        const service = new Service(aServiceClass);
        const serviceAlias = new Service();
        serviceAlias.setAlias("service").setPublic(true);

        container.setService("service", service);
        container.setService("service_alias", serviceAlias);

        const resolved = await container.get("service_alias");
        expect(resolved).toBeInstanceOf(aServiceClass);
    });

    it("Service alias of alias", async () => {
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

        const resolved = await container.get("alias4");
        expect(resolved).toBeInstanceOf(aServiceClass);
    });

    it("Service alias cyclic faild", async () => {
        const container = new Container();

        const serviceAlias1 = new Service();
        const serviceAlias2 = new Service();

        serviceAlias1.setAlias("alias2").setPublic(true);
        serviceAlias2.setAlias("alias1").setPublic(true);

        container.setService("alias1", serviceAlias1);
        container.setService("alias2", serviceAlias2);

        const resolve = async () => await container.get("alias1");
        await expect(resolve()).rejects.toThrow(DiResolutionError);
    });

    it("Cyclic services should failed", async () => {
        const container = new Container();

        const service1 = new Service();
        const service2 = new Service();

        service1.setArgs(new Arguments([new Argument("service", "service2")]));
        service2.setArgs(new Arguments([new Argument("service", "service1")]));

        const resolve = async () => await container.get("service1");
        await expect(resolve()).rejects.toThrow(DiResolutionError);
    });

    class aServiceClassForConfigurator {
        configureService(service) {
            service.setConfigured(true);
        }
    }

    class aServiceClassConfigured {
        protected configured: boolean;
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

    it("Service using configurator", async () => {
        const container = new Container();

        const configurator = new Service(aServiceClassForConfigurator);
        const service = new Service(aServiceClassConfigured);
        service.setConfigurator(new Configurator("configurator", "configureService"));

        container.setService("service1", service.setPublic(true));
        container.setService("configurator", configurator);

        const resolved = await container.get("service1");
        expect(resolved.isConfigured()).toBe(true);
    });

    it("Definition should set the parentId if parent is present", async () => {
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
        const container = new Container();
        await container.loadDefinitions({
            services: {
                parent,
                child
            }
        });

        const services = container.getServices();
        const childService = services.child;
        const childArgs = childService.getArgs();

        expect(childService.getModule()).toBe("dady");
        expect(childArgs.get(0)).toBeInstanceOf(Argument);
        expect(childArgs.get(0).getValue()).toBe("dep1");
        expect(childArgs.get(1)).toBeInstanceOf(Argument);
        expect(childArgs.get(1).getValue()).toBe("dep_override");
    });
});
