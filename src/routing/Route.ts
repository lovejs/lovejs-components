import * as _ from "lodash";

export class Route {
    protected matchers;
    protected middlewares;
    protected attributes;

    constructor({ matchers = {}, middlewares = {} }) {
        this.matchers = matchers;
        this.middlewares = middlewares;
        this.attributes = {};
    }

    getMatchers() {
        return this.matchers;
    }

    setMatchers(matchers) {
        this.matchers = matchers;
    }

    getMatcher(name) {
        return this.matchers[name] || false;
    }

    getMiddlewares() {
        return this.middlewares;
    }

    setMddlewares(middlewares) {
        this.middlewares = middlewares;
    }

    getMiddleware(middleware) {
        return _.get(this.middlewares, middleware);
    }

    getAttributes() {
        return this.attributes;
    }

    setAttributes(attributes) {
        this.attributes = attributes;
    }

    setAttribute(key, value) {
        this.attributes[key] = value;
    }
}
