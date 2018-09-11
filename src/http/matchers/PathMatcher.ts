import * as _ from "lodash";
import * as pathToRegexp from "path-to-regexp";

import { BaseMatcher } from "../../routing";

const removeFirstSlash = path => (path[0] == "/" ? path.slice(1) : path);
const cache = {};

export type PathMatcherOptions = {
    path: string;
    params?: object;
};

export class PathMatcher extends BaseMatcher {
    /**
     * @inheritdoc
     */
    match(context, options: PathMatcherOptions) {
        options = this.normalizeOptions(options);
        const { path, params } = options;

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

    /**
     * Normalize options
     * @param options
     */
    normalizeOptions(options: PathMatcherOptions | string): PathMatcherOptions {
        return typeof options == "string" ? { path: options } : options;
    }

    /**
     * @inheritdoc
     */
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

    /**
     * @inheritdoc
     */
    mergeOptions(options: PathMatcherOptions | string, parentOptions: PathMatcherOptions) {
        let segments = [];
        options = this.normalizeOptions(options);
        parentOptions = this.normalizeOptions(parentOptions);

        if (parentOptions && parentOptions.path) {
            segments.push(removeFirstSlash(parentOptions.path));
        }

        if (options && options.path) {
            segments.push(removeFirstSlash(options.path));
        }

        let path = `/${segments.join("/")}`;

        return {
            path,
            params: _.assign(parentOptions.params || {}, options.params || {})
        };
    }
}
