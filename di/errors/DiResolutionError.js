const ExtendableError = require("es6-error");

module.exports = class DiResolutionError extends ExtendableError {
    constructor(resolution, message, error) {
        super(`Error resolving service "${resolution.getId()}" : ${message} ${error ? error.message : ''}\nDebug Stack: ${resolution.debugStack()}`);
        this.wrappedError = error;
    }
};
