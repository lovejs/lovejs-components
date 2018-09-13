import * as _ from "lodash";

const specials = `._-`;
const alphaNums = "a-zA-Z0-9";
const alphaNumsSpecials = `${alphaNums}${specials}`;

export const ServiceNamePattern: string = `^[${alphaNumsSpecials}]+$`;
export const ServiceAutoPattern: string = `^[${alphaNumsSpecials}]+\\*{1}[${alphaNumsSpecials}]*$`;

export const ParameterNamePattern: string = "^[a-zA-Z0-9]+(?:[:._-]+[a-zA-Z0-9]+)*$";

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
        args: argsSchema,
        await: { type: "boolean" }
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

export const serviceSchema = {
    type: "object",
    properties: {
        module: {},
        creation: { type: "string", enum: ["auto", "module", "function", "class"] },
        factory: factorySchema,
        configurator: configuratorSchema,
        _extends: {
            type: "boolean"
        },
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
    not: { prohibited: ["module", "factory", "alias", "parent", "_extends"] },
    incompatibleProperties: ["module", "factory", "alias"],
    additionalProperties: false,
    errorMessage: {
        not: `Service definition should have at least one property among "module", "factory", "parent" or "alias" (and only one)`,
        incompatibleProperties: `Service definition should have only ONE property among "module", "factory" and "alias"`,
        additionalProperties: "Unknow service definition property"
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

export const definitionsSchema = {
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
                additionalProperties: "Invalid service name definition"
            }
        }
    },
    additionalProperties: false
};
