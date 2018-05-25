const _ = require("lodash");

class Route {
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

    setAttributes(key, value) {
        this.attributes[key] = value;
    }
}

module.exports = Route;
