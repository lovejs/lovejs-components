const ExtendableError = require("es6-error");

module.exports = class DiResolutionError extends ExtendableError {
    constructor(resolution, message, error) {
        const stack = resolution.isRoot ? "" : `\nDebug Stack: ${resolution.debugStack()}`;
        super(`Error resolving service "${resolution.getId()}" : ${message} ${error ? error.message : ""} ${stack}`);
        this.wrappedError = error;
    }
};
