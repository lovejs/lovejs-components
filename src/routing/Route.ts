import * as _ from "lodash";
import { Middleware } from "../middlewares";

export type MatchersOptions = {
    [name: string]: any;
};

export type MiddlewaresOptions = {
    [name: string]: any;
};

export type RouteAttributes = {
    [name: string]: any;
};

export type RouteOptions = {
    matchers?: MatchersOptions;
    middlewares?: MiddlewaresOptions;
    attributes?: RouteAttributes;
};

/**
 * A route is defined by a list of matchers with options
 * a list of middlewares with options
 * and a list of attributes
 */
export class Route {
    /**
     * A map of matchers indexed by name
     * with options as value
     */
    protected matchers: MatchersOptions;

    /**
     * A map of middlewares indexed by name
     * with options as value
     */
    protected middlewares: MiddlewaresOptions;

    /**
     * A map of route attributes
     */
    protected attributes: RouteAttributes;

    constructor({ matchers = {}, middlewares = {}, attributes = {} }: RouteOptions) {
        this.matchers = matchers;
        this.middlewares = middlewares;
        this.attributes = attributes;
    }

    /**
     * Return the name of matcher
     */
    getMatchers(): string[] {
        return Object.keys(this.matchers);
    }

    /**
     * Return the matchers options
     */
    getMatchersOptions(): MatchersOptions {
        return this.matchers;
    }

    /**
     * Set the matchers for this routes
     * @param matchers
     */
    setMatchersOptions(options: MatchersOptions) {
        this.matchers = options;
    }

    /**
     * Get a matcher Option by name
     * @param name
     */
    getMatcherOptions(name: string): any {
        return this.matchers[name] || false;
    }

    /**
     * Get the list of middlewares
     */
    getMiddlewares(): string[] {
        return Object.keys(this.middlewares);
    }

    /**
     * Get the middlewares options
     */
    getMiddlewaresOptions(): MiddlewaresOptions {
        return this.middlewares;
    }

    /**
     * Set the middlewares options
     * @param middlewares
     */
    setMddlewaresOptions(middlewares: MiddlewaresOptions) {
        this.middlewares = middlewares;
    }

    /**
     * Get options for a middleware by name
     * @param middleware
     */
    getMiddlewareOptions(name: string): any {
        return this.middlewares[name] || false;
    }

    /**
     * Get the route attributes
     */
    getAttributes(): any {
        return this.attributes;
    }

    /**
     * Set the route attributes
     */
    setAttributes(attributes: RouteAttributes) {
        this.attributes = attributes;
    }

    /**
     * Set a route attribute
     * @param key
     * @param value
     */
    setAttribute(key: string, value: any) {
        this.attributes[key] = value;
    }
}
