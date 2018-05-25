const _ = require("lodash");

const Alias = require("./Alias");
const Arguments = require("./Arguments");
const Call = require("./Call");
const Configurator = require("./Configurator");
const Factory = require("./Factory");
const Tag = require("./Tag");

const DiServiceError = require("../errors/DiServiceError");

const defaultsProperties = {
    module: false,
    creation: "auto",
    factory: false,
    alias: false,
    configurator: false,
    args: false,
    tags: [],
    calls: [],
    preloaded: true,
    shared: true,
    autowired: false,
    public: false
};

const availableCreations = ["auto", "module", "function", "class"];

class Service {
    constructor(arg, options = {}) {
        if (_.isString(arg)) {
            this.module = arg;
        } else if (arg instanceof Factory) {
            this.factory = arg;
        } else if (arg instanceof Alias) {
            this.alias = alias;
        } else if (_.isFunction(arg)) {
            this.module = arg;
        }

        _.assign(this, _.pick(options, _.keys(defaultsProperties)));

        this.parentId = options.parentId || false;
        this.parent = false;
        this.compiled = false;
    }

    isCompiled() {
        return this.compiled;
    }

    setCompiled() {
        this.compiled = true;
    }

    getProperty(property) {
        if (_.has(this, property)) {
            return _.get(this, property);
        } else if (this.hasParent()) {
            return this.getParent().getProperty(property);
        } else {
            return _.get(defaultsProperties, property);
        }
    }

    getParentId() {
        return this.parentId;
    }

    setParentId(parentId) {
        this.parentId = parentId;
    }

    hasParent() {
        return this.getParent() ? true : false;
    }

    getParent() {
        return this.parent;
    }

    setParent(parent) {
        this.parent = parent;
    }

    getModule() {
        return this.getProperty("module");
    }

    setModule(module) {
        this.module = module;
        return this;
    }

    getCreation() {
        return this.getProperty("creation");
    }

    setCreation(creation) {
        if (!_.isString(creation) || !availableCreations.includes(creation.toLowerCase())) {
            throw new DiServiceError(`Invalid service creation provided. Must be one of "${availableCreations.join(", ")}" `);
        }
        this.creation = creation.toLowerCase();
        return this;
    }

    getFactory() {
        return this.getProperty("factory");
    }

    hasFactory() {
        return _.has(this, "factory");
    }

    setFactory(factory) {
        if (!(factory instanceof Factory)) {
            throw new DiServiceError(`Service factory must be an instanceof "Factory" when setting throught setFactory`);
        }
        this.factory = factory;

        return this;
    }

    getConfigurator() {
        return this.getProperty("configurator");
    }

    hasConfigurator() {
        return _.has(this, "configurator");
    }

    setConfigurator(configurator) {
        if (!(configurator instanceof Configurator)) {
            throw new DiServiceError("Service configurator must be an instanceof Configurator when setting throught setConfigurator");
        }
        this.configurator = configurator;

        return this;
    }

    getAlias() {
        return this.alias;
    }

    setAlias(alias) {
        this.alias = alias;

        return this;
    }

    getArgs() {
        const ownArgs = _.get(this, "args");
        // own args ?
        if (ownArgs) {
        }
        // parent args ?
        // replace ?
        // merge ?
        return this.args;
    }

    /*
    let args = definition.args;

    if (definition.parent) {
        const parent = this.getDefinition(definition.parent);
        if (!parent) {
            throw new Error(`The parent service ${definition.parent} of ${definitionId} doesn't exist`);
        }

        args = parent.args || [];

        if (_.isArray(definition.args)) {
            args = definition.args;
        } else if (_.isObject(definition.args)) {
            _.each(definition.args, (v, k) => {
                if (_.has(args, k)) {
                    args[k] = v;
                }
            });
        }

        definition = _.defaults(definition, parent);
    }
    */

    setArgs(args) {
        this.args = new Arguments(args);

        return this;
    }

    getCalls() {
        return this.getProperty("calls");
    }

    hasCalls() {
        const calls = this.getCalls();
        return calls && calls.length > 0;
    }

    setCalls(calls) {
        this.calls = [];
        if (calls) {
            calls.map(c => this.addCall(c));
        }

        return this;
    }

    getCall() {
        return Call;
    }

    addCall(aCall) {
        if (!(aCall instanceof Call)) {
            throw new DiServiceError("Service calls must be instance of Call when adding throught addCall method");
        }

        if (!this.calls) {
            this.calls = [];
        }

        this.calls.push(aCall);
        return this;
    }

    getTags() {
        return this.getProperty("tags");
    }

    setTags(tags) {
        this.tags = [];
        tags.map(t => this.addTag(t));
        return this;
    }

    getTag(label) {
        const tags = this.getTags();
        if (!tags) {
            return false;
        }

        for (let i = 0; i < tags.length; i++) {
            const tag = this.tags[i];
            if (tag.getName() === label) {
                return tag;
            }
        }

        return false;
    }

    hasTag(label) {
        return this.getTag(label) ? true : false;
    }

    addTag(tag) {
        if (!(tag instanceof Tag)) {
            throw new DiServiceError("Service tags must be instanceof Tag when adding throught addTag method");
        }

        if (!this.tags) {
            this.tags = [];
        }
        this.tags.push(tag);

        return this;
    }

    setPreloaded(preloaded) {
        this.preloaded = preloaded;
        return this;
    }

    isPreloaded() {
        return this.getProperty("preloaded") && this.getProperty("shared");
    }

    setShared(shared) {
        this.shared = shared;
        return this;
    }

    isShared() {
        return this.getProperty("shared");
    }

    setAutowired(autowired) {
        this.autowired = autowired;
        return this;
    }

    isAutowired() {
        return this.getProperty("autowired");
    }

    setPublic(isPublic) {
        this.public = isPublic;
        return this;
    }

    isPublic() {
        return this.getAlias() || this.getProperty("public");
    }
}

module.exports = Service;
