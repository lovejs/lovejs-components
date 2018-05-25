const _ = require("lodash");

const allowedSpecials = `:._\\-/`;
const ServiceNamePattern = `^[a-zA-Z0-9]+(?:[${allowedSpecials}]+[a-zA-Z0-9]+)*$`;
const ServiceAutoPattern = `^[${allowedSpecials}a-zA-Z0-9]*\\*[${allowedSpecials}a-zA-Z0-9]*$`;

const ParameterNamePattern = "^[a-zA-Z0-9]+(?:[:._-]+[a-zA-Z0-9]+)*$";

const argsSchema = {
    oneOf: [{ type: "array" }, { type: "object" }]
};

const tagSchema = {
    oneOf: [
        { type: "string" },
        {
            type: "object",
            properties: {
                tag: { type: "string" }
            },
            required: ["tag"],
            errorMessage: {
                required: "Tag defined as object must have a tag property"
            }
        }
    ]
};

const callSchema = {
    type: "object",
    properties: {
        method: { type: "string" },
        args: argsSchema
    },
    required: ["method"],
    additionalProperties: false
};

const factorySchema = {
    type: "object",
    properties: {
        service: { type: "string" },
        method: { type: "string" },
        args: argsSchema
    },
    required: ["service"],
    additionalProperties: false
};

const configuratorSchema = {
    type: "object",
    properties: {
        service: { type: "string" },
        method: { type: "string" },
        args: argsSchema
    },
    required: ["service"],
    additionalProperties: false
};

const serviceSchema = {
    type: "object",
    properties: {
        module: {},
        creation: { type: "string", enum: ["auto", "module", "function", "class"] },
        factory: factorySchema,
        configurator: configuratorSchema,
        alias: {
            type: "string"
        },
        parent: {
            type: "string"
        },
        args: argsSchema,
        calls: {
            type: "array",
            items: callSchema
        },
        tags: {
            if: { type: "array" },
            then: { items: tagSchema },
            else: tagSchema
        },
        shared: {
            type: "boolean"
        },
        preloaded: {
            type: "boolean"
        },
        autowired: {
            type: "boolean"
        },
        public: {
            type: "boolean"
        }
    },
    not: { prohibited: ["module", "factory", "alias", "parent"] },
    incompatibleProperties: ["module", "factory", "alias"],
    errorMessage: {
        not: `Service definition should have at least one property among "module", "factory", "parent" or "alias" (and only one)`,
        incompatibleProperties: `Service definition should have only ONE property among "module", "factory" and "alias"`
    }
};

const serviceAutoSchema = {
    type: "object",
    properties: {
        from: { type: "string" },
        pattern: { oneOf: [{ type: "array" }, { type: "string" }] },
        services: { type: "object" }
    },
    required: ["from"]
};

const collectionServicesSchema = _.omit(serviceSchema, [
    "properties.module",
    "properties.factory",
    "properties.alias",
    "properties.parent",
    "not"
]);

const definitionsSchema = {
    type: "object",
    properties: {
        imports: {
            type: "array",
            items: {
                type: "string"
            }
        },
        collections: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    type: { type: "string" },
                    prefix: { type: "string" },
                    paths: {
                        type: "array",
                        items: { type: "string" }
                    },
                    services: collectionServicesSchema
                }
            }
        },
        parameters: {
            type: "object",
            default: {},
            patternProperties: {
                [ParameterNamePattern]: {}
            },
            additionalProperties: false
        },
        services: {
            type: "object",
            default: {},
            patternProperties: {
                [ServiceAutoPattern]: serviceAutoSchema,
                [ServiceNamePattern]: serviceSchema
            },
            additionalProperties: false,
            errorMessage: {
                additionalProperties: "Invalid service name provided"
            }
        }
    }
};

module.exports = { definitionsSchema, serviceSchema };
