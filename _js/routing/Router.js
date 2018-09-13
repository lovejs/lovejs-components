const _ = require("lodash");
const {
    Validation,
    errors: { ValidationError }
} = require("../validation");
const Route = require("./Route");

class Router {
    constructor(loader, matchers = {}) {
        this.routes = {};
        this.loader = loader;
        this.matchers = matchers;
    }

    getRoutes() {
        return this.routes;
    }

    getRoute(name) {
        if (!this.routes[name]) {
            throw new Error(`Unknow route with name "${name}"`);
        }

        return this.routes[name];
    }

    addRoute(name, route) {
        this.routes[name] = route;
    }

    loadFile(file) {
        const routes = this.loader.getRoutesFromFile(file);

        for (let name in routes) {
            this.addRoute(name, routes[name]);
        }
    }

    getMatchers() {
        return this.matchers;
        return names ? _.pick(this.matchers, name) : this.matchers;
    }

    getMatcher(name) {
        return this.matchers[name] || false;
    }

    async getMatchingRoute(context) {
        const routes = this.getRoutes();

        for (const name in routes) {
            const route = this.getRoute(name);
            const matchers = _.pick(this.getMatchers(), _.keys(route.getMatchers()));

            let match = true;
            let results = {};

            for (let matcherName in matchers) {
                const matcher = matchers[matcherName];
                let data = await matcher.match(context, route.getMatcher(matcherName), route);
                if (!data) {
                    match = false;
                    break;
                }

                results[matcherName] = data;
            }

            if (match) {
                for (let matcherName in matchers) {
                    const matcher = matchers[matcherName];
                    if (_.isFunction(matcher.onRouteMatch)) {
                        await matcher.onRouteMatch(context, results[matcherName]);
                    }
                }

                context.setAttribute("_route", route);
                context.setAttribute("_route_name", name);
                context.setAttribute("_matchers", results);
                context.setAttribute("_middlewares", route.getMiddlewares());

                return route;
            }
        }

        return false;
    }
}

module.exports = Router;
