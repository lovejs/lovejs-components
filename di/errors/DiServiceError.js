const ExtendableError = require("es6-error");

module.exports = class DiServiceError extends ExtendableError {
    constructor(service, message) {
        super(`Error for service ${service} ${message}`);
    }
}
