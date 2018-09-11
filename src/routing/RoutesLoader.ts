import * as _ from "lodash";
import { ConfigurationLoader, ConfigurationLoaderOptions } from "../configuration";
import { LoaderInterface } from "./LoaderInterface";
import { RoutesMap } from "./Router";
import { RouteOptions } from "./Route";

const routeNameSkip = "_";

export type RoutesLoaderOptions = {
    loaders?: LoaderInterface[];
};

export type RouteDefinition = { ".type"?: string; [property: string]: any };

export type RoutesDefinitions = {
    routes: { [name: string]: RouteDefinition };
};

/**
 * The main routes loader select the appropriate loader based on definition type
 */
export class RoutesLoader extends ConfigurationLoader {
    /**
     * Array of available loaders
     */
    protected loaders: LoaderInterface[];

    constructor({ loaders }: RoutesLoaderOptions = { loaders: [] }, configOptions: ConfigurationLoaderOptions = {}) {
        super(configOptions);
        this.loaders = loaders;
    }

    /**
     * Get the first loader supporting given type
     * @param type
     */
    getLoader(type: string): LoaderInterface {
        const loader = _.find(this.loaders, loader => loader.supports(type));
        if (!loader) {
            throw new Error(`RoutesLoader didn't find any loader for route of type "${type}"`);
        }

        return loader;
    }

    /**
     * Return the definitions validation schem
     */
    getSchema() {
        return {
            type: "object",
            properties: {
                routes: require("./schemas/routes")
            }
        };
    }

    /**
     * Given a definition, extract and return the type
     */
    extractType(definition): string {
        const type = definition[".type"] || "default";
        delete definition[".type"];

        return type;
    }

    /**
     * Generate the final route name based on route name and current name
     */
    generateRouteName(routeName: string, currentName?: string): string {
        if (!currentName) {
            return routeName;
        }

        return routeName === routeNameSkip ? currentName : `${currentName}.${routeName}`;
    }

    /**
     * Get the routes from definitions file
     * @param definitions
     * @param parentOptions
     * @param currentName
     */
    async getRoutes(definitions: RoutesDefinitions, parentOptions: RouteOptions = {}, currentName?: string): Promise<RoutesMap> {
        let routes = {};
        for (let routeName in definitions.routes) {
            const definition = definitions.routes[routeName];
            const type = this.extractType(definition);
            const loader = this.getLoader(type);
            routeName = this.generateRouteName(routeName, currentName);

            routes = { ...routes, ...(await loader.getRoutes(definition, this, parentOptions, routeName)) };
        }

        return routes;
    }

    /**
     * Load routes from given file
     * @param file
     */
    async getRoutesFromFile(filepath: string): Promise<RoutesMap> {
        return await this.getRoutes(await this.loadFile(filepath));
    }
}
