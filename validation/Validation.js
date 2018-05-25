const Ajv = require("ajv");
const ajvErrors = require("ajv-errors");
const ajvKeywords = require("ajv-keywords");

const ValidationError = require("./errors/ValidationError");
const keywords = require("./validators");

const ajv = new Ajv({ useDefaults: true, coerceTypes: true, allErrors: true, jsonPointers: true, $data: true });
ajvErrors(ajv);
ajvKeywords(ajv);

for (let keyword of keywords) {
    ajv.addKeyword(keyword.name, keyword.config);
}

class Validation {
    constructor(schema, data = null) {
        if (!schema) {
            throw new Error(`Validation expect an ajv json schema as first argument`);
        }

        this.validator = ajv.compile(schema);

        if (data) {
            return this.validate(data);
        }
    }

    registerInstanceClass(name, classDef) {
        var instanceofDefinition = ajvKeywords.get("instanceof").definition;

        instanceofDefinition.CONSTRUCTORS[name] = classDef;
    }

    validate(data) {
        if (this.validator(data)) {
            return data;
        } else {
            const errors = this.validator.errors;
            throw new ValidationError(this.validator.errors);
        }
    }
}

module.exports = Validation;
