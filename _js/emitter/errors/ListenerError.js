const ExtendableError = require("es6-error");

module.exports = class ListenerError extends ExtendableError {
    constructor(message) {
        super(message);
    }
}
