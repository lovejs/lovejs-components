const _ = require("lodash");
const { isFunction, getMatchingGroup } = require("../utils");

const { PathFinder } = require("../pathfinder");

const Arguments = require("./Definitions/Arguments");
const Argument = require("./Definitions/Argument");
const Service = require("./Definitions/Service");

const DefinitionsLoader = require("./DefinitionsLoader");
const AutowireResolver = require("./Autowiring/AutowireResolver");
const { parametersExtracter } = require("../reflection");

const Resolution = require("./Resolution");
const DiResolutionError = require("./errors/DiResolutionError");
const DiServiceError = require("./errors/DiServiceError");

const { ServiceNamePattern } = require("./schemas/definitions");

module.exports = class Container {
    constructor(_options) {
        const options = _.defaults(_options, {
            instances: {},
            parameters: {},
            debug: false
        });
        this.compiled = false;
        this.debug = options.debug;
        this.instances = {};
        this.services = {};
        this.shared = {};
        this.parameters = {};
        this.resolving = {};
        this.argumentResolvers = {};
        this.resolutionStack = [];

        this.pathfinder = options.pathfinder || new PathFinder();
        this.autowireResolver = options.autowireResolver || new AutowireResolver(parametersExtracter);
        this.definitionsLoader = options.loader || new DefinitionsLoader(this.pathfinder);

        this.instances["container"] = this;
        this.instances["service_container"] = this;
        this.instances["pathfinder"] = this.pathfinder;

        _.each(options.instances, (instance, id) => {
            this.instances[id] = instance;
        });

        _.each(options.parameters, (value, name) => {
            this.parameters[name] = value;
        });

        this.setArgumentTypeResolver("service", (container, resolution, prefix) => async (value, options) => {
            let serviceName;

            if (_.isString(value)) {
                serviceName = value;
            } else if (value instanceof Argument && value.type == "parameter") {
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
        });

        this.setArgumentTypeResolver("parameter", (container, resolution) => async value => {
            return container.getParameter(value);
        });

        this.setArgumentTypeResolver("services", (container, resolution, prefix) => async options => {
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
        });

        this.setArgumentTypeResolver("default", (container, resolution, prefix) => async value => {
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
        });
    }

    hasInstance(serviceId) {
        return this.instances[serviceId] ? true : false;
    }

    getInstance(serviceId) {
        return this.instances[serviceId] || false;
    }

    getInstancesNames() {
        return _.keys(this.instances);
    }

    getDefinitionsLoader() {
        return this.definitionsLoader;
    }

    setDefinitionsLoader(definitionsLoader) {
        this.definitionsLoader = definitionsLoader;
    }

    getAutowireResolver() {
        return this.autowireResolver;
    }

    setAutowireResolver(autowireResolver) {
        this.autowireResolver = autowireResolver;
    }

    getArgumentResolver(type) {
        const resolver = this.argumentResolvers[type];
        if (!resolver) {
            throw new Error(`Argument resolver for type ${type} is not defined`);
        }
        return resolver;
    }

    setArgumentTypeResolver(type, resolver) {
        this.argumentResolvers[type] = resolver;
    }

    async loadDefinitions(definitions, origin) {
        const { parameters, services } = await this.definitionsLoader.loadFile(definitions);

        _.each(parameters, (value, name) => {
            this.setParameter(name, value);
        });

        _.each(services, (service, name) => {
            this.setService(name, service);
        });

        return this;
    }

    compile() {
        this.resolveParametersPass();
        this.linkParentsPass();

        _.each(this.getServices(), service => service.setCompiled(true));
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

    getServices(filter) {
        let services = this.services;
        let conditions = [];

        if (filter) {
            if (filter.tag) {
                conditions.push(s => s.hasTag(filter.tag));
            }

            if (_.has(filter.preloaded)) {
                conditions.push(s => s.isPreloaded() === filter.preloaded);
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

    getServicesIds(filter) {
        return _.keys(this.getServices(filter));
    }

    getServicesTags(tagNames) {
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

    setServices(services) {
        for (let serviceId in services) {
            this.setService(serviceId, services[serviceId]);
        }
    }

    getService(id) {
        return this.services[id] || false;
    }

    hasService(id) {
        if (this.instances[id] || this.services[id]) {
            return true;
        }
        return false;
    }

    setService(id, service) {
        if (!RegExp(ServiceNamePattern).test(id)) {
            throw new Error(`Invalid service name specified ${id}. Service name contains invalid characters.`);
        }

        this.services[id] = service;
    }

    setServiceAlias(id, target) {
        const service = new Service();
        service.setAlias(target);
        this.services[id] = service;
    }

    getParameter(name) {
        return this.parameters[name];
    }

    setParameter(name, value) {
        this.parameters[name] = value;
    }

    getParameters() {
        return this.parameters;
    }

    resolveParameter(name) {
        if (this.resolutionStack.includes(name)) {
            throw new Error("Redondance cyclique dans les paramètres... We are fucked.");
        } else {
            this.resolutionStack.push(name);
        }

        const value = this.resolveParameterValue(this.getParameter(name));
        this.setParameter(name, value);
    }

    resolveParameterValue(value) {
        if (_.isArray(value)) {
            return _.map(value, v => this.resolveParameterValue(v));
        } else if (_.isPlainObject(value)) {
            return _.mapValues(value, v => this.resolveParameterValue(v));
        } else {
            return value;
        }
    }

    resolveParameterString(value) {
        const params = getMatchingGroup(/(?:^|[^%])%([^%]+)%(?!%)/g, value, 1);
        if (params.length > 0) {
            if (value.replace(_.first(params), "") === "%%") {
                return this.resolveParameter(_.first(params));
            } else {
                _.each(params, param => {
                    value = value.replace(`%${param}%`, this.resolveParameter(param).toString());
                });
            }
        }

        return value.replace("%%", "%");
    }

    async get(serviceId) {
        return this.resolve(new Resolution(serviceId), true);
    }

    async resolve(resolution, isPublic = false) {
        if (this.debug) {
            console.log(resolution.debugStack());
        }

        if (!(resolution instanceof Resolution)) {
            throw new Error("Container resolve method argument should be a Resolution");
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
            const aliasResolution = new Resolution(service.getAlias(), `${resolution.getId()} @alias `);
            aliasResolution.setMethod(resolution.getMethod());

            return this.resolve(aliasResolution);
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

    async load(resolution, service) {
        if (this.resolving[resolution.getId()] && resolution.hasParent(resolution.getId())) {
            throw new DiResolutionError(resolution.getId(), `Cyclic`);
        }

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
            const instanceArgs = await this.resolveArguments(args, factoryResolution, "args");

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

            const target = _.isString(module) ? await this.pathfinder.get(module).getDefaultContent(true) : module;
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

    async resolveArguments(args, resolution, prefix = "") {
        if (!args) {
            return [];
        }

        if (!(args instanceof Arguments)) {
            throw new DiResolutionError(resolution, "Arguments must be an instance of Arguments");
        }

        let list = args.getArgs();
        let resolved = [];

        for (let idx in list) {
            resolved.push(await this.resolveArgument(list[idx], resolution, `${prefix}[${idx}]`)); //resolution.addChild(`${prefix}[${idx}`,resolution.clone(null, `[${idx}]`)));
        }

        return resolved;
    }

    async resolveArgument(arg, resolution, prefix = "") {
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
};
