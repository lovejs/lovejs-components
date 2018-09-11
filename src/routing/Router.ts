import * as _ from "lodash";

import { Route, MatcherInterface } from "./index";
import { RoutesLoader } from "./RoutesLoader";

export type RoutesMap = {
    [name: string]: Route;
};

export type RouterOptions = {
    loader?: any;
    routes?: RoutesMap;
    matchers?: { [name: string]: MatcherInterface };
};

/**
 * The router select a route based on matcher
 */
export class Router {
    protected routes: RoutesMap;
    protected loader;
    protected matchers: { [name: string]: MatcherInterface };

    constructor({ loader = new RoutesLoader(), matchers = {}, routes = {} }: RouterOptions) {
        this.routes = routes;
        this.loader = loader;
        this.matchers = matchers;
    }

    /**
     * Get all route
     */
    getRoutes(): RoutesMap {
        return this.routes;
    }

    /**
     * Get a route by name
     * @param name
     */
    getRoute(name: string): Route | false {
        return this.routes[name];
    }

    /**
     * Add a route with specified name
     * @param name
     * @param route
     */
    addRoute(name: string, route: Route) {
        this.routes[name] = route;
    }

    /**
     * Load routes using routes loader from given file
     * @param file
     */
    loadFile(file: string) {
        const routes = this.loader.getRoutesFromFile(file);

        for (let name in routes) {
            this.addRoute(name, routes[name]);
        }
    }

    /**
     * Get the list of configured matchers
     */
    getMatchers() {
        return this.matchers;
    }

    /**
     * Get a matcher by name
     * @param name
     */
    getMatcher(name): MatcherInterface | false {
        return this.matchers[name] || false;
    }

    /**
     * Get the matching route for given Context
     */
    async getMatchingRoute(context): Promise<Route | false> {
        const routes = this.getRoutes();

        for (const routeName in routes) {
            const route = routes[routeName];
            const matchers = _.pick(this.getMatchers(), route.getMatchers());

            let match = true;
            let results = {};

            for (let matcherName in matchers) {
                const matcher = matchers[matcherName];
                let data = await matcher.match(context, route.getMatcherOptions(matcherName), route);
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
                context.setAttribute("_route_name", routeName);
                context.setAttribute("_matchers", results);
                context.setAttribute("_middlewares", route.getMiddlewaresOptions());

                return route;
            }
        }

        return false;
    }
}
