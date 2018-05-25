const _ = require("lodash");
const ExtendableError = require("es6-error");

module.exports = class ValidationError extends ExtendableError {
    constructor(errors) {
        const errorsList = errors.map(e => `At path "${e.dataPath}" ${e.message}`).join("\n");
        super(errorsList);
        this.errors = errors;
    }

    getErrors() {
        return this.errors;
    }
};
