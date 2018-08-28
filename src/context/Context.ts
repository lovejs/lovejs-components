import * as _ from "lodash";

export class Context {
    protected attributes;
    protected options;
    protected middlewares;

    constructor(options) {
        this.attributes = {};
        this.options = options;
    }

    getOptions() {
        return this.options;
    }

    getAttributes() {
        return this.attributes;
    }

    setAttributes(attributes) {
        this.attributes = attributes;
    }

    hasAttribute(path) {
        return _.has(this.attributes, path);
    }

    getAttribute(path, defaultValue) {
        return _.get(this.attributes, path, defaultValue);
    }

    setAttribute(path, value) {
        _.set(this.attributes, path, value);
    }

    getMiddlewares() {
        return this.middlewares;
    }
}
