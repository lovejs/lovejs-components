import { RoutesMap } from "./Router";
import { RoutesLoader, RouteDefinition } from "./RoutesLoader";

/**
 * A route loader load returns a list of Route based on definition
 */
export interface LoaderInterface {
    /**
     * Check if the route loader supports this definintion type
     * @param type
     */
    supports(type: string): boolean;

    /**
     * Given a definition object, returns the corresponding routes
     * @param definition The definition object
     * @param routesLoader The main routes loader
     * @param inheritOptions Herited options
     * @param currentName The current route name
     */
    getRoutes(definition: RouteDefinition, routesLoader: RoutesLoader, inheritOptions?: any, currentName?: string): Promise<RoutesMap>;
}
