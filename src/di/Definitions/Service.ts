import * as _ from "lodash";

import { Alias, Call, Configurator, Factory, Tag } from "./index";

import { DiServiceError } from "../errors";

export enum ServiceCreationType {
    auto,
    module,
    function,
    class
}

export type ServiceProperties = {
    module?: string;
    creation?: ServiceCreationType;
    alias?: Alias;
    factory?: Factory;
    arguments?: [];
    tags?: Tag[];
    calls?: Call[];
    configurator?: Configurator;
    preloaded?: boolean;
    shared?: boolean;
    autowired?: boolean;
    public?: boolean;
    parentId?: string;
};

const defaultsProperties = Object.freeze({
    module: false,
    creation: "auto",
    alias: false,
    factory: false,
    arguments: [],
    tags: [],
    calls: [],
    configurator: false,
    preloaded: true,
    shared: true,
    autowired: false,
    public: false
});

const availableCreations = ["auto", "module", "function", "class"];

/**
 * Represent a service inside the Container
 */
export class Service {
    protected _properties;
    protected parentId: string;
    protected parent: Service;
    protected compiled: boolean;
    protected extends: boolean;

    constructor(mainProperty?: any, properties?: ServiceProperties) {
        this._properties = _.pick(properties, _.keys(defaultsProperties));

        if (mainProperty) {
            if (_.isString(mainProperty)) {
                this.setModule(mainProperty);
            } else if (mainProperty instanceof Factory) {
                this.setFactory(mainProperty);
            } else if (mainProperty instanceof Alias) {
                this.setAlias(mainProperty);
            } else if (_.isFunction(mainProperty)) {
                this.setModule(mainProperty);
            }
        }

        this.parentId = properties && properties.parentId;
        this.compiled = false;
        this.extends = false;
    }

    getInitialProperties() {
        return this._properties;
    }

    setProperties(properties) {
        this._properties = { ...this._properties, ...properties };
    }

    isExtends() {
        return this.extends;
    }

    setExtends() {
        this.extends = true;
    }

    isCompiled() {
        return this.compiled;
    }

    setCompiled() {
        this.compiled = true;
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

    getProperty(property) {
        if (_.has(this._properties, property)) {
            return _.get(this._properties, property);
        } else if (this.hasParent()) {
            return this.getParent().getProperty(property);
        } else {
            return _.clone(_.get(defaultsProperties, property));
        }
    }

    setProperty(property, value) {
        _.set(this._properties, property, value);
        return this;
    }

    hasProperty(property) {
        return _.has(this._properties, property);
    }

    getModule() {
        return this.getProperty("module");
    }

    setModule(serviceModule) {
        return this.setProperty("module", serviceModule);
    }

    getCreation() {
        return this.getProperty("creation");
    }

    setCreation(creation: string) {
        if (!_.isString(creation) || !availableCreations.includes(creation.toLowerCase())) {
            throw new DiServiceError(`Invalid service creation provided. Must be one of "${availableCreations.join(", ")}" `);
        }
        return this.setProperty("creation", creation.toLowerCase());
    }

    getFactory() {
        return this.getProperty("factory");
    }

    hasFactory() {
        return this.hasProperty("factory");
    }

    setFactory(factory: Factory) {
        return this.setProperty("factory", factory);
    }

    getConfigurator() {
        return this.getProperty("configurator");
    }

    hasConfigurator() {
        return this.hasProperty("configurator");
    }

    setConfigurator(configurator: Configurator) {
        return this.setProperty("configurator", configurator);
    }

    getAlias() {
        return this.getProperty("alias");
    }

    setAlias(alias) {
        return this.setProperty("alias", alias);
    }

    getArguments() {
        return this.getProperty("arguments");
    }

    setArguments(args: any[]) {
        if (!(args instanceof Array)) {
            throw new Error(`setArguments on Service expects an array, "${typeof args}" given`);
        }

        return this.setProperty("arguments", args);
    }

    getCalls() {
        return this.getProperty("calls");
    }

    hasCalls() {
        const calls = this.getCalls();
        return calls && calls.length > 0;
    }

    setCalls(calls: Call[]) {
        this.setProperty("calls", []);
        if (calls) {
            calls.map(c => this.addCall(c));
        }

        return this;
    }

    addCall(aCall: Call) {
        if (!(aCall instanceof Call)) {
            throw new Error("Service class 'addCall' method expect an instance of 'Call'");
        }
        const calls = this.getProperty("calls") || [];
        calls.push(aCall);

        return this.setProperty("calls", calls);
    }

    getTags() {
        return this.getProperty("tags") || [];
    }

    setTags(tags) {
        this.setProperty("tags", []);
        tags.map(t => this.addTag(t));

        return this;
    }

    getTag(label) {
        const tags = this.getTags();
        if (!tags) {
            return false;
        }

        for (let i = 0; i < tags.length; i++) {
            const tag = tags[i];
            if (tag.getName() === label) {
                return tag;
            }
        }

        return false;
    }

    hasTag(label) {
        return this.getTag(label) ? true : false;
    }

    addTag(tag: Tag) {
        if (!(tag instanceof Tag)) {
            throw new Error("Service class 'addTag' method expect an instance of 'Tag'");
        }
        const tags = this.getTags() || [];
        tags.push(tag);

        return this.setProperty("tags", tags);
    }

    setPreloaded(preloaded) {
        return this.setProperty("preloaded", preloaded);
    }

    isPreloaded() {
        return this.getProperty("preloaded") && this.getProperty("shared");
    }

    setShared(shared) {
        return this.setProperty("shared", shared);
    }

    isShared() {
        return this.getProperty("shared");
    }

    setAutowired(autowired) {
        return this.setProperty("autowired", autowired);
    }

    isAutowired() {
        return this.getProperty("autowired");
    }

    setPublic(isPublic) {
        return this.setProperty("public", isPublic);
    }

    isPublic() {
        return this.getAlias() || this.getProperty("public");
    }
}
