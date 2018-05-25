const _ = require("lodash");
const { ConfigLoader } = require("../config");

const routeNameSkip = "_";
const typeProperty = ".type";

class RoutesLoader extends ConfigLoader {
    constructor(loaders = [], options = {}) {
        super(options);
        this.loaders = loaders;
    }

    getLoader(type) {
        const loader = _.find(this.loaders, loader => loader.support(type));
        if (!loader) {
            throw new Error(`RoutesLoader didn't find any loader for route of type "${type}"`);
        }

        return loader;
    }

    getSchema() {
        return {
            type: "object",
            properties: {
                routes: require("./schemas/routes")
            }
        };
    }

    getType(definition) {
        return definition[typeProperty] || "default";
    }

    validate(data) {
        data = super.validate(data);
        if (_.isPlainObject(data.routes)) {
            _.each(data.routes, (definition, routeName) => this.getLoader(this.getType(definition)).validate(definition));
        }

        return data;
    }

    normalize(data) {
        data = super.normalize(data);
        data.routes = _.mapValues(data.routes, definition => this.getLoader(this.getType(definition)).normalize(definition, this));

        return data;
    }

    getRoutes(definitions, inheritOptions = {}, currentName = null) {
        const routes = {};
        _.each(definitions.routes, (definition, routeName) => {
            const loader = this.getLoader(this.getType(definition));
            const name = routeName === routeNameSkip ? currentName : currentName ? `${currentName}.${routeName}` : routeName;

            _.merge(routes, loader.getRoutes(definition, this, inheritOptions, name));
        });

        return routes;
    }

    getRoutesFromFile(file) {
        return this.getRoutes(this.loadFile(file));
    }
}

module.exports = RoutesLoader;
