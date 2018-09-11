import * as _ from "lodash";
import { Validator, ValidationError } from "../../validation";

import { Route } from "..";
import { RoutesLoader, RouteDefinition } from "../RoutesLoader";
import { RoutesMap } from "../Router";
import { MatcherInterface } from "../MatcherInterface";
import { Middleware } from "../../middlewares";
import { LoaderInterface } from "../LoaderInterface";
import { RouteOptions } from "../Route";

const isMatcherProperty = p => p[0] === "_";
const isMatcher = (v, k) => isMatcherProperty(k);

const childrenProperty = "+";

type MatchersMap = {
    [name: string]: MatcherInterface;
};

type MiddlewaresMap = {
    [name: string]: Middleware;
};

type DefaultLoaderOptions = {
    matchers?: MatchersMap;
    middlewares?: MiddlewaresMap;
};

/**
 * Given a route definition like
 * {
 *      _path:      /api/books
 *      _method:    GET
 *      controller: books:all
 * }
 */
export class DefaultLoader implements LoaderInterface {
    /**
     * Map of available matchers
     */
    protected matchers: MatchersMap;

    /**
     * Map of available middlewares
     */
    protected middlewares: MiddlewaresMap;

    constructor({ matchers, middlewares }: DefaultLoaderOptions = { matchers: {}, middlewares: {} }) {
        this.matchers = matchers;
        this.middlewares = middlewares;
    }

    /**
     * @inheritdoc
     */
    supports(type) {
        return type === "default";
    }

    /**
     * Set the matchers
     * @param matchers
     */
    setMatchers(matchers: MatchersMap) {
        this.matchers = matchers;
    }

    /**
     * Set the middlewares
     * @param middlewares
     */
    setMiddlewares(middlewares: MiddlewaresMap) {
        this.middlewares = middlewares;
    }

    /**
     * Get a matcher by name
     */
    getMatcher(name: string): MatcherInterface {
        return this.matchers[name];
    }

    /**
     * Get a middleware by name
     */
    getMiddleware(name: string): Middleware {
        return this.middlewares[name];
    }

    /**
     * Transform a route definition, into route options
     * @param definition The Route definition
     */
    async definitionToOptions(definition: RouteDefinition): Promise<RouteOptions> {
        let matchers = _.mapKeys(_.pickBy(definition, isMatcher), (v, k) => k.slice(1));
        let middlewares = _.omitBy(definition, isMatcher);

        matchers = _.mapValues(matchers, (options, matcherName) => {
            const matcher = this.getMatcher(matcherName);
            if (!matcher) {
                throw new Error(`Unknow matcher "${matcherName}"`);
            }
            try {
                return matcher.validateOptions(options);
            } catch (error) {
                if (error instanceof ValidationError) {
                    throw new Error(`Invalid options for matcher "${matcherName}" : ${error.message}`);
                } else {
                    throw error;
                }
            }
        });

        middlewares = _.mapValues(middlewares, (options, name) => {
            const middleware = this.getMiddleware(name);
            if (!middleware) {
                throw new Error(`Unknow middleware "${name}". Available middlewares : ${_.keys(this.middlewares).join(", ")}`);
            }
            try {
                return middleware.normalizeOptions(options);
            } catch (error) {
                if (error instanceof ValidationError) {
                    throw new Error(`Invalid options for middleware "${name}" : ${error.message}`);
                } else {
                    throw error;
                }
            }
        });

        return {
            matchers,
            middlewares
        };
    }

    /**
     * Merge route options with parent route options
     * @param routeOptions
     * @param parentOptions
     */
    async mergeOptions(routeOptions: RouteOptions, parentOptions?: RouteOptions) {
        if (!parentOptions) {
            return routeOptions;
        }

        const matchers = _.mergeWith(
            {},
            parentOptions.matchers || {},
            routeOptions.matchers || {},
            (parentValue, routeValue, matcherName) => this.getMatcher(matcherName).mergeOptions(routeValue, parentValue)
        );

        const middlewares = _.mergeWith(
            {},
            parentOptions.middlewares || {},
            routeOptions.middlewares || {},
            (parentValue, routeValue, middlewareName) => this.getMiddleware(middlewareName).mergeOptions(routeValue, parentValue)
        );

        return { matchers, middlewares };
    }

    /**
     * @inheritdoc
     */
    async getRoutes(
        definition: RouteDefinition,
        routesLoader: RoutesLoader,
        parentOptions?: RouteOptions,
        currentName?: string
    ): Promise<RoutesMap> {
        let routes = {};
        const isParent = definition[childrenProperty] ? true : false;

        definition = _.omit(definition, [childrenProperty]);

        let routeOptions;
        try {
            routeOptions = await this.definitionToOptions(definition);
            routeOptions = await this.mergeOptions(routeOptions, parentOptions);
        } catch (e) {
            console.log(e);
            throw new Error(`Error loading route "${currentName}" : ${e.message}`);
        }

        if (isParent) {
            const subRoutes = await routesLoader.getRoutes({ routes: definition[childrenProperty] }, routeOptions, currentName);
            routes = { ...routes, ...subRoutes };
        } else {
            routes[currentName] = this.getRoute(routeOptions);
        }

        return routes;
    }

    /**
     * Create a route instance
     * @param options
     */
    getRoute(options): Route {
        return new Route(options);
    }
}
