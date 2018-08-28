import * as _ from "lodash";

import { isClass } from "../utils";

export class ExtractedParameter {
    /**
     * Name of the parameter
     */
    protected name: string;

    /**
     * True if the parameter has a default value
     */
    protected defaultValue: boolean = false;

    /**
     * Comments attached to the parameter
     */
    protected comments: string;

    constructor(name: string, defaultValue: boolean = false, comments?: string) {
        this.name = name;
        this.defaultValue = defaultValue;
        this.comments = comments;
    }

    getName() {
        return this.name;
    }

    hasDefault() {
        return this.defaultValue;
    }

    getComments() {
        return this.comments;
    }
}

export function parametersExtracter(target, method?) {
    const parseOptions = {
        ranges: false,
        plugins: ["objectRestSpread"]
    };

    if (!method) {
        method = "constructor";
    }

    let expression;
    try {
        expression = require("@babel/parser").parseExpression(target.toString(), parseOptions);

        //console.log(require("util").inspect(expression, { depth: null }));
    } catch (e) {
        throw new Error(e);
    }

    let params;

    switch (expression.type) {
        case "ClassExpression":
            const wantedMethod = _.find(
                _.get(expression, "body.body"),
                e => _.get(e, "type") === "ClassMethod" && _.get(e, "key.name") === method
            );

            if (wantedMethod) {
                params = wantedMethod.params;
            } else {
                const parent = Object.getPrototypeOf(target);
                if (parent && isClass(parent)) {
                    return parametersExtracter(parent, method);
                } else {
                    return [];
                }
            }
            break;
        case "ArrowFunctionExpression":
        case "FunctionExpression":
            params = expression.params;
            break;
        default:
            throw new Error(`Unhandle expression type: ${expression.type}`);
    }

    return extractParameters(params);
}

const extractParameters = params => {
    return _.map(params, extractParameter);
};

const extractComments = (node): string => {
    if (node.trailingComments && node.trailingComments[0]) {
        return node.trailingComments[0].value.trim();
    }
};

const extractKey = key => {
    switch (key.type) {
        case "Identifier":
            return key.name;
        case "StringLiteral":
            return key.value;
        default:
            throw new Error("Default value using service must be string");
    }
};

const extractParameter = node => {
    switch (node.type) {
        case "Identifier": // a
            return new ExtractedParameter(node.name, false, extractComments(node));
        case "ObjectProperty": // a: b
            const key = extractKey(node.key);
            return { key, value: new ExtractedParameter(key, node.value.type == "AssignmentPattern", extractComments(node)) };
        case "AssignmentPattern": // a = b
            const { left } = node;
            switch (left.type) {
                case "Identifier":
                    return new ExtractedParameter(left.name, true, extractComments(node));
                default:
                    throw new Error("Unsupported autowiring left node type " + left.type);
            }

        case "ObjectPattern": // {a, b}
            const o = {};
            _.each(node.properties, p => {
                const prop = extractParameter(p);
                if (prop) {
                    const { key, value } = prop;
                    o[key] = value;
                }
            });
            return o;
        case "ArrayPattern": // [a, b, c]
            return _.map(node.elements, extractParameter).filter(e => e);
        case "RestElement":
        case "RestProperty":
            return false;
        default:
            throw new Error("Unhandle param type in service constructor : " + node.type);
    }
};
