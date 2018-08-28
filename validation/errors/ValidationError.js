const _ = require("lodash");
const ExtendableError = require("es6-error");

module.exports = class ValidationError extends ExtendableError {
    constructor(errors) {
        const errorsList = errors
            .map(e => console.log(e) && `At path "${e.dataPath}" ${e.message} (${JSON.stringify(e.params)})`)
            .join("\n");
        super(errorsList);
        this.errors = errors;
    }

    getErrors() {
        return this.errors;
    }
};
