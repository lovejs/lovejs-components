import * as _ from "lodash";

import { isFunction } from "../utils";

import { Arguments, Argument, Service } from "./Definitions";

import { ModulesResolver, Resolution, DefinitionsLoader, AutowireResolver, ConfigDefinitionsLoader } from "./index";

import { DiResolutionError, DiServiceError } from "./errors";

import { ServiceNamePattern } from "./schemas/definitions";
import { LocalModulesResolver } from "./resolvers";

export type ArgumentResolver = (container: Container, resolution: Resolution, prefix?: string) => (value, options) => Promise<any>;

export type CallableMap = { [id: string]: any };
export type ServicesMap = { [id: string]: Service };
export type ParametersMap = { [name: string]: any };

export type ContainerOptions = {
    debug?: boolean;
    instances?: CallableMap;
    parameters?: ParametersMap;
    definitionsLoader?: DefinitionsLoader;
    modulesResolver?: ModulesResolver;
};

export type ServicesFilter = {
    tag?: string;
    preloaded?: boolean;
};

export class Container {
    /**
     * Is the container compiled
     */
    protected compiled: boolean = false;

    /**
     * Is the container in debug mode
     */
    protected debug: boolean;

    /**
     * List of services
     */
    protected services: ServicesMap;

    /**
     * List of parameters
     */
    protected parameters: ParametersMap;

    /**
     * List of instances
     */
    protected instances;

    /**
     * List of shared services instances
     */
    protected shared;

    protected resolving;

    /**
     * Map of arguments resolve with type as key
     */
    protected argumentResolvers: { [type: string]: ArgumentResolver };

    protected resolutionStack;

    /**
     * The modules resolver
     */
    protected modulesResolver: ModulesResolver;

    protected autowireResolver;
    protected definitionsLoader;

    constructor(options: ContainerOptions = {}) {
        const {
            debug = false,
            instances = {},
            parameters = {},
            definitionsLoader = new ConfigDefinitionsLoader(),
            modulesResolver = new LocalModulesResolver()
        } = options;

        this.debug = debug;
        this.instances = instances;
        this.parameters = parameters;
        this.services = {};
        this.shared = {};
        this.parameters = {};
        this.resolving = {};
        this.argumentResolvers = {};
        this.resolutionStack = [];

        this.modulesResolver = modulesResolver;
        this.autowireResolver = new AutowireResolver();
        this.definitionsLoader = definitionsLoader;

        this.instances["container"] = this;
        this.instances["service_container"] = this;
        this.instances["modules_resolver"] = this.modulesResolver;

        _.each(options.instances, (instance, id) => {
            this.instances[id] = instance;
        });

        _.each(options.parameters, (value, name) => {
            this.parameters[name] = value;
        });

        this.argumentResolvers["service"] = (container, resolution, prefix) => async (value, options) => {
            let serviceName;

            if (_.isString(value)) {
                serviceName = value;
            } else if (value instanceof Argument && value.getType() == "parameter") {
                serviceName = await this.resolveArgument(value, resolution, `${prefix}[value]`);
            } else {
                throw new DiResolutionError(
                    resolution,
                    `Trying to resolve service name from value "${value}" failed. String or parameter expected as service name.`
                );
            }

            const instance = await container.resolve(resolution.addChild(prefix, serviceName));
            if (!instance && options.required !== false) {
                throw new DiResolutionError(resolution, `Failed to resolve required service "${serviceName}"`);
            }

            return instance;
        };

        this.argumentResolvers["parameter"] = container => async parameter => container.getParameter(parameter);

        this.argumentResolvers["services"] = (container, resolution, prefix) => async options => {
            let services;
            let orderBy = options.orderBy || false;
            let indexBy = options.indexBy || false;

            if (options.tag) {
                services = container.getServicesTags(options.tag);
                orderBy = orderBy ? orderBy : "tag.priority";
            } else {
                services = container.getServicesIds(options).map(id => ({ id }));
            }

            let results = [];
            let idx = 0;
            for (let { id, tag } of services) {
                const instance = await container.resolve(
                    resolution.addChild(`${prefix}!services(${options.tag ? options.tag : ""})[${idx}]`, id)
                );
                results.push({ id, tag: tag ? tag.getData() : {}, instance });
                idx++;
            }

            if (orderBy) {
                results = _.orderBy(results, orderBy);
            }

            if (indexBy) {
                return _.mapValues(_.keyBy(results, indexBy), "instance");
            } else {
                return _.map(results, "instance");
            }
        };

        this.argumentResolvers["default"] = (container, resolution, prefix) => async value => {
            let res;
            if (_.isArray(value)) {
                res = [];
                for (let v in value) {
                    res.push(await container.resolveArgument(value[v], resolution, `${prefix}[${v}]`));
                }
            } else if (_.isPlainObject(value)) {
                res = {};
                for (let v in value) {
                    res[v] = await container.resolveArgument(value[v], resolution, `${prefix}[${v}]`);
                }
            } else {
                res = value;
            }
            return res;
        };
    }

    /**
     * Check if container has an instance for given serviceId
     */
    hasInstance(serviceId: string) {
        return this.instances[serviceId] ? true : false;
    }

    /**
     * Get an instance by service id
     */
    getInstance(serviceId: string) {
        return this.instances[serviceId] || false;
    }

    /**
     * Get the services id of instances
     */
    getInstancesNames(): string[] {
        return _.keys(this.instances);
    }

    /**
     * Get the definition loader
     */
    getDefinitionsLoader(): DefinitionsLoader {
        return this.definitionsLoader;
    }

    /**
     * Set the definition loader
     * @param definitionsLoader
     */
    setDefinitionsLoader(definitionsLoader: DefinitionsLoader) {
        this.definitionsLoader = definitionsLoader;
    }

    /**
     * Get the autowire resolver
     */
    getAutowireResolver() {
        return this.autowireResolver;
    }

    /**
     * Set the autowire resolver
     * @param autowireResolver
     */
    setAutowireResolver(autowireResolver) {
        this.autowireResolver = autowireResolver;
    }

    /**
     * Get an argument resolver by type
     * @param type
     */
    getArgumentResolver(type: string): ArgumentResolver {
        const resolver = this.argumentResolvers[type];
        if (!resolver) {
            throw new Error(`Argument resolver for type ${type} is not defined`);
        }
        return resolver;
    }

    /**
     * Set an argument resolver for type
     * @param type The type
     * @param resolver The argument resolver
     */
    setArgumentTypeResolver(type: string, resolver: ArgumentResolver) {
        this.argumentResolvers[type] = resolver;
    }

    /**
     * Load a set of definitions or a definition file
     * @param definitions
     */
    async loadDefinitions(...args) {
        const { parameters, services } = await this.definitionsLoader.load(...args);

        _.each(parameters, (value, name) => {
            this.setParameter(name, value);
        });

        _.each(services, (service, name) => {
            this.setService(name, service);
        });

        return this;
    }

    /**
     * Compile the container
     */
    compile() {
        this.resolveParametersPass();
        this.linkParentsPass();

        _.each(this.getServices(), service => service.setCompiled());
        this.compiled = true;
    }

    resolveParametersPass() {
        _.each(this.parameters, (value, name) => {
            this.resolutionStack = [];
            this.resolveParameter(name);
        });
    }

    linkParentsPass() {
        _.each(this.getServices(), (service, name) => {
            if (service.getParentId()) {
                service.setParent(this.getService(service.getParentId()));
            }
        });
    }

    async preload() {
        return Promise.mapSeries(this.getServicesIds({ preloaded: true }), id => this.resolve(new Resolution(id)));
    }

    /**
     * Get a list of services based on filter
     * @param filter
     */
    getServices(filter?: ServicesFilter) {
        let services = this.services;
        let conditions = [];

        if (filter) {
            if (filter.tag) {
                conditions.push((s: Service) => s.hasTag(filter.tag));
            }

            if (filter.preloaded) {
                conditions.push((s: Service) => s.isPreloaded() === filter.preloaded);
            }
        }

        if (conditions.length > 0) {
            return _.pickBy(services, s => {
                for (let i = 0; i < conditions.length; i++) {
                    if (!conditions[i](s)) {
                        return false;
                    }
                }

                return true;
            });
        } else {
            return services;
        }
    }

    /**
     * Return a list of services id based on filter
     * @param filter The filters
     */
    getServicesIds(filter?: ServicesFilter) {
        return _.keys(this.getServices(filter));
    }

    /**
     * Retrieve a list of services matching at least one of tagNames
     * @param tagNames
     */
    getServicesTags(tagNames: string | string[]) {
        if (_.isString(tagNames)) {
            tagNames = [tagNames];
        }

        const matching = _.pickBy(this.services, s => _.some(tagNames, tagName => s.hasTag(tagName)));

        return _.map(matching, (service, id) => ({
            id,
            service,
            tag: tagNames.length == 1 ? service.getTag(tagNames[0]) : null
        }));
    }

    /**
     * Set a bunch of services
     * @param services
     */
    setServices(services: ServicesMap) {
        for (let id in services) {
            this.setService(id, services[id]);
        }
    }

    /**
     * Get a service by id
     * @param id The id of service to retrieve
     */
    getService(id: string): Service | false {
        return this.services[id] || false;
    }

    /**
     * Check if container contains an instance or service with specified id
     * @param id The service id to look for
     */
    hasService(id: string) {
        if (this.instances[id] || this.services[id]) {
            return true;
        }
        return false;
    }

    /**
     * Set a service as specified id
     * @param id
     * @param service
     */
    setService(id: string, service: Service) {
        if (!RegExp(ServiceNamePattern).test(id)) {
            throw new Error(`Invalid service name specified ${id}. Service name contains invalid characters.`);
        }

        if (service.isExtends()) {
            if (_.has(this.services, id)) {
                this.services[id].setProperties(service.getInitialProperties());
                return;
            }
        }

        this.services[id] = service;
    }

    /**
     * Get a parameter by it's name
     * @param name
     */
    getParameter(name: string) {
        return this.parameters[name];
    }

    /**
     * Set a parameter
     * @param name
     * @param value
     */
    setParameter(name: string, value: any) {
        this.parameters[name] = value;
    }

    /**
     * Get the parameters maps
     */
    getParameters(): ParametersMap {
        return this.parameters;
    }

    /**
     * Resolve a parameter by it's name
     * @param name
     */
    resolveParameter(name: string) {
        if (this.resolutionStack.includes(name)) {
            throw new Error("Cyclic parameters resolving");
        } else {
            this.resolutionStack.push(name);
        }

        const value = this.resolveParameterValue(this.getParameter(name));
        this.setParameter(name, value);
    }

    /**
     * Resolve the value of a parameter
     */
    resolveParameterValue(value) {
        if (_.isArray(value)) {
            return _.map(value, v => this.resolveParameterValue(v));
        } else if (_.isPlainObject(value)) {
            return _.mapValues(value, v => this.resolveParameterValue(v));
        } else {
            return value;
        }
    }

    /**
     * Retrieve a service instance by id
     * @param id
     */
    async get(id: string) {
        return this.resolve(new Resolution(id), true);
    }

    /**
     * Resolve a service resolution
     * @param resolution
     * @param isPublic
     */
    protected async resolve(resolution: Resolution, isPublic = false) {
        if (this.debug) {
            console.log(resolution.debugStack());
        }

        if (resolution.hasParent(resolution.getId())) {
            throw new DiResolutionError(resolution, `Cyclic service`);
        }

        if (this.hasInstance(resolution.getId())) {
            return resolution.resolve(this.getInstance(resolution.getId()));
        }

        const service = this.getService(resolution.getId());
        if (!service) {
            throw new DiResolutionError(resolution, `Service "${resolution.getId()}" not found in container`);
        }

        if (isPublic && !service.isPublic()) {
            throw new DiServiceError(
                resolution.getId(),
                `Service is a private service and cannot be accessed directly with container.get()`
            );
        }

        if (service.getAlias()) {
            return this.resolve(resolution.addChild("@alias", service.getAlias()));
        }

        resolution.setService(service);

        if (this.shared[resolution.getId()]) {
            return resolution.resolve(this.shared[resolution.getId()]);
        }

        const resolved = await this.load(resolution, service);

        if (resolution.isRoot()) {
            await resolution.traverse(async resolution => {
                const calls = resolution.getCalls();
                if (calls) {
                    const service = resolution.getService();
                    const instance = resolution.getInstance();

                    for (let callIdx = 0; callIdx < calls.length; callIdx++) {
                        const call = calls[callIdx];
                        const method = call.getMethod();
                        let args = call.getArgs();
                        if (!instance[method] || !isFunction(instance[method])) {
                            throw new DiResolutionError(
                                resolution,
                                `The method "${method}" of service call n°${callIdx + 1} doesn't exist`
                            );
                        }
                        if (args.count() === 0 && service.isAutowired()) {
                            args = await this.autowireResolver.resolve(instance.constructor, method, args);
                        }

                        try {
                            const resolvedArgs = await this.resolveArguments(args, resolution, `@calls[${callIdx}](${method})`);
                            const callResult = instance[method](...resolvedArgs);
                            if (call.getAwait()) {
                                await callResult;
                            }
                        } catch (error) {
                            throw new DiResolutionError(resolution, `when performing call n°${callIdx + 1} on method "${method}"`, error);
                        }
                    }
                }
            });
        }

        return resolution.resolve(resolved);
    }

    protected async load(resolution, service) {
        const promise = this.resolving[resolution.getId()] ? this.resolving[resolution.getId()] : this.loadService(resolution, service);

        if (service.isShared()) {
            this.resolving[resolution.getId()] = promise;
        }

        const instance = await promise;

        if (service.isShared()) {
            delete this.resolving[resolution.getId()];
        }

        return instance;
    }

    async loadService(resolution, service) {
        let args = service.getArgs();
        let instance;

        if (service.hasFactory()) {
            const factoryConfig = service.getFactory();
            const factoryService = factoryConfig.getService();
            const factoryMethod = factoryConfig.getMethod();
            const factoryResolution = new Resolution(factoryService, `${resolution.getId()} -> @factory`);
            const factory = await this.resolve(factoryResolution);
            const instanceArgs = args ? await this.resolveArguments(args, factoryResolution, "args") : [];

            if (factoryMethod) {
                if (!factory[factoryMethod] || !isFunction(factory[factoryMethod])) {
                    throw new DiResolutionError(
                        resolution,
                        `The method "${factoryMethod}" is not a method/function on the factory service "${factoryService}"`
                    );
                }
                try {
                    instance = await factory[factoryMethod](...instanceArgs);
                } catch (error) {
                    throw new DiResolutionError(resolution, `Calling factory "${factoryService}" method "${factoryMethod}"`, error);
                }
            } else {
                try {
                    instance = await factory(...instanceArgs);
                } catch (error) {
                    throw new DiResolutionError(resolution, `Calling factory "${factoryService}"`, error);
                }
            }
        } else {
            const module = service.getModule();
            let creation = service.getCreation();

            const target = _.isString(module) ? await this.modulesResolver.resolve(module) : module;
            const isConstructor = obj => !!obj.prototype && !!obj.prototype.constructor.name;

            if (creation === "auto") {
                if (isConstructor(target)) {
                    creation = "class";
                } else if (isFunction(target)) {
                    creation = "function";
                } else {
                    throw new DiResolutionError(
                        resolution,
                        `The service didn't return a function nor a class. Did you forget to export the module ? If you want to use the creation mode "module", it must be explicit in the service configuration`
                    );
                }
            }

            if (creation !== "module" && service.isAutowired()) {
                try {
                    args = this.autowireResolver.resolve(target, null, args);
                } catch (e) {
                    console.error(e);
                    console.trace();
                    throw new DiResolutionError(resolution, `Error autowiring service parameters : ${e.message}`);
                }
            }

            let instanceArgs = [];
            if (creation !== "module" && args && args.count() > 0) {
                instanceArgs = await this.resolveArguments(args, resolution, "@constructor"); //resolution.clone(null, "@constructor"));
            }

            switch (creation) {
                case "module":
                    instance = target;
                    break;
                case "function":
                    instance = target(...instanceArgs);
                    break;
                case "class":
                    instance = new target(...instanceArgs);
                    break;
                default:
                    throw new DiResolutionError(
                        resolution,
                        `Invalid service creation type "${creation}" or unable to auto-detect service creation mode`
                    );
            }
        }

        resolution.setInstance(instance);

        if (service.isShared()) {
            this.shared[resolution.getId()] = instance;
        }

        if (service.hasCalls()) {
            const calls = service.getCalls();
            resolution.setCalls(calls);
        }

        if (service.hasConfigurator()) {
            const configurator = service.getConfigurator();
            const configuratorService = await this.resolve(
                new Resolution(configurator.getService(), `${resolution.getId()}'s configurator`)
            );
            const configuratorMethod = configurator.getMethod();

            if (!configuratorService[configuratorMethod] || !isFunction(configuratorService[configuratorMethod])) {
                throw new DiResolutionError(resolution, `The configurator method "${configuratorMethod}" doesn't exist`);
            }

            await configuratorService[configuratorMethod](instance);
        }

        return instance;
    }

    /**
     * Resolve a list of arguments with their real values
     * @param args The arguments
     * @param resolution The current resolution
     * @param prefix The resolution prefix
     */
    async resolveArguments(args: Arguments, resolution?: Resolution, prefix: string = "") {
        if (!(args instanceof Arguments)) {
            throw new DiResolutionError(resolution, `resolveArguments expect an Arguments class instance`);
        }
        let resolved = [];

        for (let idx = 0; idx < args.count(); idx++) {
            const value = args.get(idx);
            resolved.push(value ? await this.resolveArgument(value, resolution, `${prefix}[${idx}]`) : null);
        }

        return resolved;
    }

    /**
     * Resolve an argument with his real value
     */
    async resolveArgument(arg: any, resolution?: Resolution, prefix: string = "") {
        if (!(arg instanceof Argument)) {
            arg = new Argument("default", arg);
        }
        try {
            const resolver = this.getArgumentResolver(arg.getType());
            return await resolver(this, resolution, prefix)(arg.getValue(), arg.getOptions());
        } catch (error) {
            throw error;
        }
    }
}
