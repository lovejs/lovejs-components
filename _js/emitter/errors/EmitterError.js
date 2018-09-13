const ExtendableError = require("es6-error");

module.exports = class EmitterError extends ExtendableError {
    constructor(message) {
        super(message);
    }
}
