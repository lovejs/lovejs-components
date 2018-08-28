import * as _ from "lodash";
import * as path from "path";

import { ConfigLoader } from "../../config";
import { definitionsSchema } from "../schemas/definitions";
import { Argument, Arguments, Alias, Call, Factory, Service, Tag } from "../Definitions";
import { DiSchemaError } from "../errors";
import { Configurator } from "../Definitions/Configurator";
import { DefinitionsLoader } from "..";
import { ParametersMap, ServicesMap } from "../Container";

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

const defaultServicesNaming = ({ key, normalizedPath }): string => key.replace("*", normalizedPath);

const defaultServiceDefinition = {
    autowired: true,
    shared: true,
    public: true,
    preloaded: true
};

export enum ServiceCreationType {
    auto,
    module,
    function,
    class
}

export interface ServiceDefinition {
    _extends?: string;
    parent?: string;
    module?: string;
    creation?: ServiceCreationType;
    factory?: Factory;
    alias?: Alias;
    configurator?: Configurator;
    args?: any[];
    tags?: Tag[];
    calls?: Call[];
    public?: boolean;
    autowired?: boolean;
    shared?: boolean;
    preloaded?: boolean;
}

export interface ServicesDefinition {
    from: string;
    pattern?: [] | string;
    services?: ServiceDefinition;
}

export class ConfigDefinitionsLoader extends ConfigLoader implements DefinitionsLoader {
    constructor(...args) {
        super(...args);
        this.tags = {
            ...this.tags,
            parameter: {
                schema: { type: "string" },
                normalize: async data => new Argument("parameter", data)
            },
            services: {
                schema: { type: "object", errorMessage: { type: "tag 'services' expect an object as argument" } },
                normalize: async data => new Argument("services", data)
            },
            service: {
                schema: {
                    oneOf: [
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
                normalize: async data => {
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
            },
            file: {
                schema: {
                    oneOf: [{ type: "string" }, { type: "function" }]
                },
                normalize: async (data, { file }) => {
                    if (typeof data == "string") {
                        return "doh";
                    } else {
                        return data(file);
                    }
                }
            }
        };
    }

    /**
     * @inheritdoc
     */
    async load(filename: string | object): Promise<{ parameters: ParametersMap; services: ServicesMap }> {
        if (typeof filename == "string") {
            return await this.loadFile(filename);
        } else {
            return await this.loadConfig(filename);
        }
    }

    /**
     * @inheritdoc
     */
    getSchema() {
        return definitionsSchema;
    }

    /**
     * Transform the data to process wildcard services
     * @param data
     */
    async transform(data) {
        data = super.transform(data);

        let services = {};
        for (let definitionId in data.services) {
            const definition = data.services[definitionId];
            if (definitionId.includes("*")) {
                services = { ...services, ...(await this.getServicesFromWildcard(definitionId, definition)) };
            } else {
                services[definitionId] = definition;
            }
        }
        data.services = services;
        return data;
    }

    /**
     * {
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
     */

    /**
     * @inheritdoc
     */
    getNormalizers() {
        return [
            ...super.getNormalizers(),
            {
                path: "services.*.factory",
                normalize: async factory => new Factory(factory.service, factory.method)
            },
            {
                path: "services.*.tags",
                normalize: async tags =>
                    _.map(_.isArray(tags) ? tags : [tags], tag => (_.isString(tag) ? new Tag(tag) : new Tag(tag.tag, _.omit(tag, "tag"))))
            },
            {
                path: "services.*.args",
                normalize: async args => (args instanceof Arguments ? args : new Arguments(args))
            },
            {
                path: "services.*.calls",
                normalize: async calls => _.map(calls, call => new Call(call.method, call.args, call.await !== false))
            },
            {
                path: "services",
                normalize: async definitions => _.mapValues(definitions, definition => this.definitionToService(definition))
            }
        ];
    }

    /**
     * Given a
     * @param definitionId The definition id including the "*"
     * @param definition
     */
    async getServicesFromWildcard(definitionId: string, definition: ServicesDefinition) {
        const naming = defaultServicesNaming;
        const from: string = (await this.normalizeTags(_.pick(definition, "from"))).from;
        const pattern = definition.pattern || "**/*.js";
        const services = definition.services;

        const files = await this.pathResolver.resolveImport(from, pattern, this.getCurrentFile());
        const definitions = {};

        for (let file of files) {
            const serviceModule = file.filePath;
            let vars = {
                info: file,
                key: definitionId,
                normalizedPath: normalizePath(file.fileNameNoExt),
                serviceId: ""
            };
            const serviceId = naming(vars);
            vars.serviceId = serviceId;

            let serviceDefinition = _.isFunction(services) ? services(vars) : _.cloneDeep(services);
            _.defaults(serviceDefinition, defaultServiceDefinition);

            /* Override module only if no generating prop is defined */
            const requiredProps = ["module", "factory", "alias", "parent"];
            if (!_.some(requiredProps, requiredProp => _.includes(_.keys(serviceDefinition), requiredProp))) {
                serviceDefinition.module = serviceModule;
            }

            const normalizedDefinition = await this.normalizeTags(serviceDefinition, "file", vars);

            definitions[serviceId] = normalizedDefinition;
        }

        return services;
    }

    /**
     * Transform a definition into a Service
     * @param definition The definition to load
     */
    definitionToService(definition: ServiceDefinition): Service {
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
