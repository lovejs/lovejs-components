import * as _ from "lodash";
const pathToRegexp = require("path-to-regexp");

import { Matcher } from "../../routing";

const removeFirstSlash = path => (path[0] == "/" ? path.slice(1) : path);
const cache = {};

class PathMatcher extends Matcher {
    match(context, { path, params }, route) {
        if (!path) {
            return false;
        }

        if (!cache[path]) {
            let tokens = [];
            let reg = pathToRegexp(path, tokens);
            cache[path] = { reg, tokens };
        }
        const { reg, tokens } = cache[path];
        const match = reg.exec(context.path);

        if (!match) {
            return false;
        }

        let values = tokens.reduce((values, token, index) => {
            let value = match && match[index + 1];
            values[token.name] = value;

            return values;
        }, {});

        _.defaults(values, params);
        return values;
    }

    getOptionsSchema() {
        return {
            oneOf: [
                { type: "string" },
                {
                    type: "object",
                    properties: {
                        path: { type: "string" },
                        params: {
                            type: "object",
                            additionalProperties: { type: "string" }
                        }
                    }
                }
            ]
        };
    }

    normalizeOptions(options) {
        this.validateOptions(options);

        if (_.isString(options)) {
            options = { path: options };
        }

        return options;
    }

    mergeOptions(options: { path?: string; params?: object } = {}, inheritOptions: { path?: string; params?: object } = {}) {
        let segments = [];

        if (inheritOptions && inheritOptions.path) {
            segments.push(removeFirstSlash(inheritOptions.path));
        }

        if (options && options.path) {
            segments.push(removeFirstSlash(options.path));
        }

        let path = `/${segments.join("/")}`;

        return {
            path,
            params: _.assign(inheritOptions.params || {}, options.params || {})
        };
    }
}

module.exports = PathMatcher;
