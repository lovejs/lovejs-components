import * as _ from "lodash";
import { Validator, ValidationError } from "../validation";
import { DefaultRouteSchema } from "./schemas/loader.default";

import { Route } from "./index";

const isMatcherProperty = p => p[0] === "_";
const isMatcher = (v, k) => isMatcherProperty(k);

const childrenProperty = "+";

export class DefaultLoader {
    protected matchers;
    protected middlewares;

    constructor(matchers = {}, middlewares = {}) {
        this.matchers = matchers;
        this.middlewares = middlewares;
    }

    support(type) {
        return type === "default";
    }

    setMatchers(matchers) {
        this.matchers = matchers;
    }

    setMiddlewares(middlewares) {
        this.middlewares = middlewares;
    }

    validate(definition) {
        const validator = new Validator();
        return validator.validate(definition, DefaultRouteSchema);
    }

    getMatcher(name) {
        return this.matchers[name];
    }

    getMiddleware(name) {
        return this.middlewares[name];
    }

    normalize(data, routesLoader) {
        return _.mapValues(data, (value, property) => {
            switch (property) {
                case childrenProperty:
                    let loaded;
                    if (_.isString(value)) {
                        loaded = routesLoader.clone().loadFile(value, routesLoader.getCurrentFile(true));
                    } else {
                        loaded = routesLoader.load({ routes: value });
                    }
                    return loaded.routes || {};
                    break;
                default:
                    return value;
            }
        });
    }

    normalizeOptions(options = {}) {
        let matchers = _.mapKeys(_.pickBy(options, isMatcher), (v, k) => k.slice(1));
        let middlewares = _.omitBy(options, isMatcher);

        matchers = _.mapValues(matchers, (options, name) => {
            const matcher = this.getMatcher(name);
            if (!matcher) {
                throw new Error(`Unknow matcher "${name}"`);
            }
            try {
                return matcher.normalizeOptions(options);
            } catch (error) {
                if (error instanceof ValidationError) {
                    throw new Error(`Invalid options for matcher "${name}" : ${error.message}`);
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

    mergeOptions(routeOptions: { matchers?: any; middlewares?: any } = {}, inheritOptions: { matchers?: any; middlewares?: any } = {}) {
        const matchers = _.mergeWith({}, inheritOptions.matchers, routeOptions.matchers, (inheritValue, routeValue, key) =>
            this.getMatcher(key).mergeOptions(routeValue, inheritValue)
        );

        const middlewares = _.mergeWith({}, inheritOptions.middlewares, routeOptions.middlewares, (inheritValue, routeValue, key) =>
            this.getMiddleware(key).mergeOptions(routeValue, inheritValue)
        );

        return {
            matchers,
            middlewares
        };
    }

    getRoutes(definition, routesLoader, inheritOptions = {}, currentName = null) {
        const routes = {};
        const isParent = definition[childrenProperty] ? true : false;
        let options = _.omit(definition, [childrenProperty]);

        try {
            options = this.normalizeOptions(options);
            options = this.mergeOptions(options, inheritOptions);
        } catch (e) {
            console.log(e);
            throw new Error(`Error loading route "${currentName}" : ${e.message}`);
        }

        if (isParent) {
            _.merge(routes, routesLoader.getRoutes({ routes: definition[childrenProperty] }, options, currentName));
        } else {
            routes[currentName] = this.getRoute(options);
        }

        return routes;
    }

    getRoute(options) {
        return new Route(options);
    }
}
