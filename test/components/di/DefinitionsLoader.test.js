import _ from "lodash";

const { Service, DefinitionsLoader, Definitions: { Arguments, Argument, Tag, Call }, helpers, errors } = require("components/di");
const { _service, _parameter } = helpers;
const DiSchemaError = errors.DiSchemaError;

const pathFinder = { resolve: a => a };
const getInstance = () => {
    return new DefinitionsLoader(pathFinder);
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

test("Create instance of an DefinitionsLoader", () => {
    expect(getInstance()).toBeInstanceOf(DefinitionsLoader);
});

test("Should return an error if definitions are invalid", () => {
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

test("Should accept valid definitions", () => {
    expect.assertions(2);
    return getInstance()
        .load(validDefinitions)
        .then(({ services, parameters }) => {
            expect(_.size(services)).toBe(3);
            expect(_.size(parameters)).toBe(4);
        });
});

test("Should return correct values for fields", () => {
    expect.assertions(14);
    return getInstance()
        .load(validDefinitions)
        .then(({ services: { service1, service2, service3 } }) => {
            expect(service1.tags.length).toBe(2);
            expect(service1.tags[0]).toBeInstanceOf(Tag);
            expect(service1.tags[0]).toMatchObject({ name: "test1" });
            expect(service1.tags[1]).toBeInstanceOf(Tag);
            expect(service1.tags[1]).toMatchObject({ name: "test2" });

            expect(service1.calls).toBeDefined();
            expect(Array.isArray(service1.calls)).toBe(true);
            expect(service1.calls.length).toBe(1);
            expect(service1.calls[0]).toBeInstanceOf(Call);

            expect(Array.isArray(service2.tags)).toBe(true);
            expect(service2.tags[0]).toMatchObject({ name: "test" });
            expect(service1.tags[0]).toBeInstanceOf(Tag);

            expect(service3.getParent()).toBe(false);
            expect(service3.getParentId()).toBe("other_service");
        });
});

test("Transform a valid definition to a service", () => {
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
});

test("Should accept tags in multiple format (string, object, array)", () => {
    expect.assertions(12);
    return getInstance
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
                expect(services[s].tags.length).toBe(1);
                expect(services[s].tags[0]).toBeInstanceOf(Tag);
                expect(services[s].tags[0].getName()).toBe("mytag");
            });
        });
});

test("Service loader should be able to import other files", () => {
    const instance = new DefinitionsLoader({ resolve: a => (_.isString(a) ? require(a) : a) });
    expect.assertions(1);
    return instance.load(importDefinitions).then(({ services }) => {
        expect(services.s1).toBeDefined();
    });
});

test("getFiles should raise error if directory doesn't exist", () => {
    expect.assertions(1);
    return instance.getFiles("/invalidpath").then(
        () => true,
        e => {
            expect(e).toBeInstanceOf(Error);
        }
    );
});

test("getFiles should raise error if path is not a directory", () => {
    expect.assertions(1);
    return instance.getFiles(__dirname + "/DefinitionsLoader.test.js").then(
        () => true,
        e => {
            expect(e).toBeInstanceOf(Error);
        }
    );
});

test("getFiles should return a list of files", () => {
    expect.assertions(1);
    return instance.getFiles(__dirname, "*.test.js", ["helpers.test.js", "{Service,Tag}.test.js"]).then(files => {
        expect(files.length).toBe(4);
    });
});
