const _ = require("lodash");
const path = require("path");

const { ConfigLoader } = require("../config");

const { definitionsSchema } = require("./schemas/definitions");
const { Argument, Arguments, Call, Factory, Service, Tag } = require("./Definitions");
const { DiSchemaError } = require("./errors");

const normalizePath = filePath =>
    filePath
        .replace(/\.[^/.]+$/, "")
        .split(path.sep)
        .join(".");

const underscorizePath = filePath =>
    filePath
        .replace(/\.[^/.]+$/, "")
        .split(path.sep)
        .join("_");

const defaultServicesNaming = ({ key, normalizedPath }) => key.replace("*", normalizedPath);

const defaultServiceDefinition = {
    autowired: true,
    shared: true,
    public: true,
    preloaded: true
};

class DefinitionsLoader extends ConfigLoader {
    getSchema() {
        return definitionsSchema;
    }

    getTags() {
        let tags = super.getTags();
        _.merge(tags, {
            parameter: {
                schema: { type: "string" },
                normalize: data => new Argument("parameter", data)
            },
            services: {
                schema: { type: "object", errorMessage: { type: "tag 'services' expect an object as argument" } },
                normalize: data => new Argument("services", data)
            },
            service: {
                schema: {
                    oneOf: [
                        { instanceof: "ConfigTag" },
                        { type: "string" },
                        {
                            type: "object",
                            properties: {
                                name: { oneOf: [{ type: "string" }, { instanceof: "ConfigTag" }] }
                            },
                            required: ["name"]
                        }
                    ]
                },
                normalize: data => {
                    let service;
                    let options = {};
                    if (_.isPlainObject(data)) {
                        service = data.name;
                        options = _.omit(data, ["name"]);
                    } else if (_.isString(data)) {
                        service = data;
                    }

                    return new Argument("service", service, options);
                }
            }
        });

        return tags;
    }

    transform(data) {
        data = super.transform(data);
        data.services = _.reduce(
            data.services,
            (services, definition, definitionId) => {
                if (definitionId.includes("*")) {
                    _.merge(services, this.getServicesFromWildcard(definition, definitionId));
                } else if (definitionId.slice(0) == "@") {
                } else {
                    services[definitionId] = definition;
                }

                return services;
            },
            {}
        );

        return data;
    }

    getNormalizers() {
        return _.concat(super.getNormalizers(), [
            {
                path: "services.*.module",
                normalize: module => {
                    if (!_.isString(module)) {
                        return module;
                    }
                    const pathfinder = this.pathfinder;
                    const ref = pathfinder.get(module, this.currentFile ? this.currentFile.getContext() : {});
                    return pathfinder.getInternalPath(ref.getFilePath(), ref.getDefaultPath());
                }
            },
            {
                path: "services.*.factory",
                normalize: factory => new Factory(factory.service, factory.method)
            },
            {
                path: "services.*.tags",
                normalize: tags =>
                    _.map(_.isArray(tags) ? tags : [tags], tag => (_.isString(tag) ? new Tag(tag) : new Tag(tag.tag, _.omit(tag, "tag"))))
            },
            {
                path: "services.*.args",
                normalize: args => (args instanceof Arguments ? args : new Arguments(args))
            },
            {
                path: "services.*.calls",
                normalize: calls => _.map(calls, call => new Call(call.method, call.args, call.await !== false))
            },
            {
                path: "services",
                normalize: definitions => _.mapValues(definitions, definition => this.definitionToService(definition))
            }
        ]);
    }

    getServicesFromWildcard(definition, definitionId) {
        const naming = definition.naming || defaultServicesNaming;
        const defFrom = this.normalizeTags(_.pick(definition, "from"));
        const defPattern = definition.pattern || "**/*.js";
        const defServices = definition.services;

        const fromPath = this.pathfinder.resolvePath(defFrom.from, this.currentFile ? this.currentFile.getContext() : {});
        const files = this.pathfinder.mget(defPattern, { cwd: fromPath });

        let services = {};

        files.map((file, index) => {
            const serviceModule = file.getFilePath();
            let params = {
                index,
                key: definitionId,
                file,
                normalizedPath: normalizePath(file.getFilePath(fromPath)),
                underscoredPath: underscorizePath(file.getFilePath(fromPath)),
                filename: file.getFileName(),
                filename_stripped: file.getFileName(true)
            };
            const serviceName = naming(params);
            params = { ...params, serviceName };

            let serviceDefinition = _.isFunction(defServices) ? defServices(params) : _.cloneDeep(defServices);
            _.defaults(serviceDefinition, defaultServiceDefinition);

            const requiredProps = ["module", "factory", "alias", "parent"];
            if (!_.some(requiredProps, requiredProp => _.includes(_.keys(serviceDefinition), requiredProp))) {
                serviceDefinition.module = serviceModule;
            }
            const normalizedDefinition = this.normalizeTags(serviceDefinition, { loop: params });

            services[serviceName] = normalizedDefinition;
        });

        return services;
    }

    definitionToService(definition) {
        let { parent, _extends, ...rest } = definition;

        const service = new Service(null, rest);

        if (parent) {
            service.setParentId(parent);
        }

        if (_extends) {
            service.setExtends();
        }

        return service;
    }
}

module.exports = DefinitionsLoader;
