import * as _ from "lodash";
import { ConfigDefinitionsLoader, Tag, Call, Service, _service, _parameter, DiSchemaError } from "../..";

const getInstance = () => {
    return new ConfigDefinitionsLoader();
};

const invalidDefinitions = {
    services: {
        invalid: {}
    }
};

const validDefinitions = {
    parameters: {
        p1: "string",
        p2: ["1", "2", "3"],
        p3: { test: 1 },
        p4: test => test
    },
    services: {
        service1: {
            module: "unknow",
            args: [_service("service2")],
            tags: ["test1", "test2"],
            calls: [{ method: "method1", args: [_service("Service2")] }]
        },
        service2: {
            factory: { service: "test" },
            tags: "test"
        },
        service3: {
            factory: { service: "service1" },
            parent: "other_service"
        }
    }
};

const importDefinitions = {
    imports: [__dirname + "/../../integration/services.js"]
};

describe("#Di [Config Definitions Loader]", function() {
    it("Create instance of an DefinitionsLoader", () => {
        expect(getInstance()).toBeInstanceOf(ConfigDefinitionsLoader);
    });

    it("Should return an error if definitions are invalid", () => {
        expect.assertions(1);
        return getInstance()
            .load(invalidDefinitions)
            .then(
                s => s,
                e => {
                    expect(e).toBeInstanceOf(DiSchemaError);
                }
            );
    });

    it("Should accept valid definitions", () => {
        expect.assertions(2);
        return getInstance()
            .load(validDefinitions)
            .then(({ services, parameters }) => {
                expect(_.size(services)).toBe(3);
                expect(_.size(parameters)).toBe(4);
            });
    });

    it("Should return correct values for fields", () => {
        expect.assertions(14);
        return getInstance()
            .load(validDefinitions)
            .then(({ services: { service1, service2, service3 } }) => {
                expect(service1.getTags().length).toBe(2);
                expect(service1.getTags()[0]).toBeInstanceOf(Tag);
                expect(service1.getTags()[0]).toMatchObject({ name: "test1" });
                expect(service1.getTags()[1]).toBeInstanceOf(Tag);
                expect(service1.getTags()[1]).toMatchObject({ name: "test2" });

                expect(service1.getCalls()).toBeDefined();
                expect(Array.isArray(service1.getCalls())).toBe(true);
                expect(service1.getCalls().length).toBe(1);
                expect(service1.getCalls()[0]).toBeInstanceOf(Call);

                expect(Array.isArray(service2.getTags())).toBe(true);
                expect(service2.getTags()[0]).toMatchObject({ name: "test" });
                expect(service1.getTags()[0]).toBeInstanceOf(Tag);

                expect(service3.getParent()).toBe(false);
                expect(service3.getParentId()).toBe("other_service");
            });
    });

    it("Transform a valid definition to a service", () => {
        const definition = {
            module: "test",
            args: [],
            tags: [],
            calls: [],
            shared: true,
            preloaded: true,
            autowired: true
        };

        const service = getInstance().definitionToService(definition);
        expect(service).toBeInstanceOf(Service);
    });

    it("Should accept tags in multiple format (string, object, array)", () => {
        expect.assertions(12);
        return getInstance()
            .load({
                services: {
                    s1: {
                        module: "module",
                        tags: "mytag"
                    },
                    s2: {
                        module: "module",
                        tags: { name: "mytag" }
                    },
                    s3: {
                        module: "module",
                        tags: ["mytag"]
                    },
                    s4: {
                        module: "module",
                        tags: [{ name: "mytag" }]
                    }
                }
            })
            .then(({ services }) => {
                _.each(["s1", "s2", "s3", "s4"], s => {
                    expect(services[s].getTags().length).toBe(1);
                    expect(services[s].getTags()[0]).toBeInstanceOf(Tag);
                    expect(services[s].getTags()[0].getName()).toBe("mytag");
                });
            });
    });

    it("Service loader should be able to import other files", () => {
        const instance = new ConfigDefinitionsLoader({ resolve: a => (_.isString(a) ? require(a) : a) });
        expect.assertions(1);
        return instance.load(importDefinitions).then(({ services }) => {
            expect(services.s1).toBeDefined();
        });
    });
});
