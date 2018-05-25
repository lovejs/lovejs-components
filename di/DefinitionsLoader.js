const _ = require("lodash");
const Ajv = require("ajv");
const globby = require("globby");
const path = require("path");
const fs = require("fs");

const { Alias, Argument, Call, Configurator, Factory, Service, Tag } = require("./Definitions");

const { definitionsSchema, serviceSchema } = require("./schemas/definitions");
const DiSchemaError = require("./errors/DiSchemaError");

const normalizePath = filePath => filePath.replace(/\.[^/.]+$/, "").replace(path.sep, "/");
const underscorizePath = filePath => filePath.replace(path.sep, "_");
const defaultServicesNaming = ({ key, normalizedPath }) => key.replace("*", normalizedPath);

const defaultServiceDefinition = {
    autowired: true,
    shared: true,
    public: true,
    preloaded: true
};

module.exports = class DefinitionsLoader {
    constructor(pathfinder) {
        const ajv = new Ajv({ useDefaults: true, allErrors: true, jsonPointers: true, $data: true });

        require("ajv-errors")(ajv);
        require("ajv-keywords")(ajv);

        ajv.addKeyword("wrapObject", {
            modifying: true,
            type: "string",
            metaSchema: {
                type: "string"
            },
            validate: (property, data, schema, path, parent, parentIndex) => {
                parent[parentIndex] = { [property]: data };
                return true;
            }
        });

        ajv.addKeyword("asTag", {
            modifying: true,
            schema: false,
            valid: true,
            validate: (data, path, parent, parentIndex) => {
                if (data) {
                    const newData = data instanceof Tag ? data : new Tag(data.tag, _.omit(data, "tag"));
                    parent[parentIndex] = newData;
                }
            }
        });

        ajv.addKeyword("wrapArray", {
            modifying: true,
            schema: false,
            valid: true,
            validate: (data, path, parent, parentIndex) => {
                parent[parentIndex] = [data];
            }
        });

        ajv.addKeyword("asCall", {
            modifying: true,
            schema: false,
            valid: true,
            validate: (data, path, parent, parentIndex) => {
                parent[parentIndex] = data instanceof Call ? data : new Call(data.method, data.args);
            }
        });

        ajv.addKeyword("asAlias", {
            modifying: true,
            schema: false,
            valid: true,
            validate: (data, path, parent, parentIndex) => {
                parent[parentIndex] = data instanceof Alias ? data : new Alias(data);
            }
        });

        ajv.addKeyword("asFactory", {
            modifying: true,
            schema: false,
            valid: true,
            validate: (data, path, parent, parentIndex) => {
                parent[parentIndex] = data instanceof Factory ? data : new Factory(data.service, data.method, data.args);
            }
        });

        ajv.addKeyword("asConfigurator", {
            modifying: true,
            schema: false,
            valid: true,
            validate: (data, path, parent, parentIndex) => {
                parent[parentIndex] = data instanceof Configurator ? data : new Configurator(data.service, data.method, data.args);
            }
        });

        ajv.addKeyword("asArguments", {
            modifying: true,
            type: ["array", "object"],
            schema: false,
            valid: true,
            validate: (data, path, parent, parentIndex) => {
                const argumentize = a => (a instanceof Argument ? a : new Argument("default", a));
                if (_.isArray(data)) {
                    parent[parentIndex] = data.map(a => argumentize(a));
                } else if (_.isObject(data)) {
                    parent[parentIndex] = _.mapValues(data, a => argumentize(a));
                }
            }
        });

        ajv.addKeyword("incompatibleProperties", {
            type: "object",
            metaSchema: {
                type: "array",
                items: { type: "string" }
            },
            validate: (properties, data) => {
                let found = 0;
                for (let i = 0; i < properties.length; i++) {
                    const property = properties[i];
                    if (data[property] !== undefined) {
                        found++;
                        if (found > 1) {
                            return false;
                        }
                    }
                }

                return true;
            }
        });

        this.validators = {
            definitions: ajv.compile(definitionsSchema),
            service: ajv.compile(serviceSchema)
        };

        this.pathfinder = pathfinder;
        this.definitions = {};
        this.parameters = {};
    }

    async load(target, context = {}) {
        let content, importContext;

        if (_.isString(target)) {
            const ref = this.pathfinder.get(target, context);
            content = ref.getContent();
            importContext = {
                cwd: ref.getDirectory()
            };
        } else {
            content = target;
        }

        const getException = (target, validator) => {
            return new DiSchemaError(_.isObject(target) ? false : target, validator.errors);
        };

        if (!this.validators.definitions(content)) {
            throw getException(target, this.validators.definitions);
        } else {
            const contentEntries = _.map(content, (entries, key) => ({ key, entries }));

            return Promise.map(contentEntries, ({ key, entries }) => {
                switch (key) {
                    case "imports":
                        return Promise.map(entries, entry => this.load(entry, importContext));
                        break;
                    case "services":
                        return Promise.all(
                            _.map(entries, (entry, key) => {
                                if (key.includes("*")) {
                                    const defaultDefinition = entry.services;
                                    const naming = entry.naming || defaultServicesNaming;
                                    const fromPath = this.pathfinder.resolvePath(entry.from, importContext);

                                    return this.pathfinder.mget(entry.pattern, { cwd: fromPath }).then(references => {
                                        return Promise.map(references, (reference, index) => {
                                            const module = reference.getFilePath();
                                            let params = {
                                                index,
                                                key,
                                                reference,
                                                normalizedPath: normalizePath(reference.getFilePath(fromPath)),
                                                underscoredPath: underscorizePath(reference.getFilePath(fromPath))
                                            };
                                            const serviceName = naming(params);
                                            params = { ...params, serviceName };

                                            const serviceDefinition = _.defaults(
                                                _.isFunction(defaultDefinition) ? defaultDefinition(params) : _.clone(defaultDefinition),
                                                defaultServiceDefinition
                                            );

                                            const requiredProps = ["module", "factory", "alias", "parent"];
                                            if (!_.some(requiredProps, e => _.includes(_.keys(serviceDefinition), e))) {
                                                serviceDefinition.module = module;
                                            }

                                            if (!this.validators.service(serviceDefinition)) {
                                                throw getException(target, this.validators.service);
                                            }

                                            serviceDefinition.origin = origin;
                                            this.definitions[serviceName] = serviceDefinition;
                                        });
                                    });
                                } else {
                                    entry.origin = origin;
                                    return (this.definitions[key] = entry);
                                }
                            })
                        );
                        break;
                    case "parameters":
                        this.parameters = _.merge(this.parameters, entries);
                        break;
                }
            }).then(() => {
                const definitions = {
                    parameters: this.parameters,
                    services: _.mapValues(this.definitions, (d, id) => this.definitionToService(d, id))
                };

                this.parameters = {};
                this.definitions = {};

                return definitions;
            });
        }
    }

    definitionToService(definition, definitionId) {
        let { parent, origin, ...rest } = definition;

        const service = new Service(null, rest);
        service.origin = origin;
        if (parent) {
            service.setParentId(parent);
        }

        return service;
    }
};
