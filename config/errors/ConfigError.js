const _ = require("lodash");
const ExtendableError = require("es6-error");

class ConfigError extends ExtendableError {
    constructor(file, message) {
        super(`Configuration Error in file ${file} ${message}`);
    }
}

module.exports = ConfigError;
