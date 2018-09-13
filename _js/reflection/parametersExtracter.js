const _ = require("lodash");
const babylon = require("babylon");

const { isClass } = require("../utils");

const extracter = (target, method) => {
    const parseOptions = {
        ranges: false,
        plugins: ["objectRestSpread"]
    };

    if (!method) {
        method = "constructor";
    }

    let expression;
    try {
        expression = require("babylon").parseExpression(target.toString(), parseOptions);
    } catch (e) {
        console.error(target.toString());
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
                    return extracter(parent, method);
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
};

const extractParameters = params => {
    return _.map(params, extractParameter);
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
            return node.name;
        case "Literal": // "a"
            return node.value;
        case "ObjectProperty":
            return { key: extractKey(node.key), value: node.value.value };
        case "AssignmentPattern": // a = b
            const { left, right } = node;
            switch (right.type) {
                case "StringLiteral":
                    return right.value;
                case "ObjectExpression":
                    const o = {};
                    _.each(right.properties, p => {
                        const prop = extractParameter(p);
                        if (prop) {
                            const { key, value } = prop;
                            o[key] = value;
                        }
                    });
                    return o;
                default:
                    throw new Error("Unsupported autowiring right node type " + right.type);
            }
        case "ObjectPattern":
            const o = {};
            _.each(node.properties, p => {
                const prop = extractParameter(p);
                if (prop) {
                    const { key, value } = prop;
                    o[key] = value;
                }
            });
            return o;
            break;
        case "ArrayPattern":
            return _.map(node.elements, extractParameter).filter(e => e);
        case "RestElement":
        case "RestProperty":
            return null;
        default:
            throw new Error("Unhandle param type in service constructor : ", node.type);
    }
};

module.exports = extracter;
