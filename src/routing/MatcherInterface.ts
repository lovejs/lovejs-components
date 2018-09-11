import { Route } from "./Route";

/**
 * A route matcher match a context
 */
export interface MatcherInterface {
    /**
     * Check if matcher match given context and return a falsy value if it failed or mixed data if it match
     *
     * @param context a Context
     * @param options A list of matcher options
     * @param route The matched route
     */
    match(context, options, route: Route): Promise<any>;

    /**
     * Validate matcher options
     */
    validateOptions?(options: any);

    /**
     * Merge matcher options with parent options
     * by default return options if any or parents one
     */
    mergeOptions?(options: any, parentOptions: any);

    /**
     * Called with the result of the match call if matcher match
     * @param context
     * @param matcherResult
     */
    onRouteMatch?(context, matcherResult: any);
}
