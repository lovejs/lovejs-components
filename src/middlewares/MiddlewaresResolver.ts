import * as _ from "lodash";

export class MiddlewareResolver {
    protected middlewares;
    protected cache;
    protected resolving;

    constructor(middlewares = {}) {
        this.middlewares = middlewares;
        this.cache = {};
        this.resolving = {};
    }

    getMiddlewares() {
        return this.middlewares;
    }

    addMiddleware(name, middleware) {
        this.middlewares[name] = middleware;
    }

    getMiddleware(name) {
        const middleware = this.middlewares[name];
        if (!middleware) {
            throw new Error(`Middleware ${name} not found. Available middlewares: ${_.keys(this.getMiddlewares()).join(", ")}`);
        }

        return middleware;
    }

    async doResolve(name, args) {
        const middleware = this.getMiddleware(name);
        const callee = _.isFunction(middleware) ? middleware : middleware.getMiddleware;

        if (!callee || !_.isFunction(callee)) {
            throw new Error(`Resolved middleware "${name}" should be function or class instance with a 'getMiddleware' method`);
        }

        return await callee.call(middleware, args);
    }

    async resolveMiddleware(name, args) {
        const key = `${name}_${JSON.stringify(args)}`;

        if (this.cache[key]) {
            return this.cache[key];
        }

        if (!this.resolving[key]) {
            this.resolving[key] = this.doResolve(name, args);
        }

        this.cache[key] = await this.resolving[key];

        return this.cache[key];
    }

    async processMiddlewares(middlewares = [], args = [], cb = null) {
        const self = this;
        let index = 0;

        async function next() {
            const l = middlewares[index - 1];
            const m = middlewares[index++];
            if (!m) {
                return;
            }
            const middleware = await self.resolveMiddleware(m[0], m[1]);
            cb && l && cb(l[0]);
            const result = await middleware.apply(middleware, [...args, next]);
            cb && cb(m[0]);
            return result;
        }
        return await next();
    }
}

module.exports = MiddlewareResolver;
