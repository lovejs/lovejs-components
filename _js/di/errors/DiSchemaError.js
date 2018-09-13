const _ = require("lodash");
const ExtendableError = require("es6-error");

class DiSchemaError extends ExtendableError {
    constructor(file, schemaError) {
        const lastError = _.last(schemaError);
        const message = `Invalid services definition in ${file ? `file ${file.toString()}` : "object"} at path "${lastError.dataPath}" : ${
            lastError.message
        }`;
        super(message);

        this.file = file;
        this.schemaError = schemaError;
    }
}

module.exports = DiSchemaError;
