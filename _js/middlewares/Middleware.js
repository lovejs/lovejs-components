const _ = require("lodash");
const { Validation } = require("../validation");

class Middleware {
    getMiddleware() {
        throw new Error("Middleware error. You must redefine the getMiddleware method.");
    }

    getOptionsSchema() {
        return {};
    }

    validateOptions(options) {
        const validator = new Validation(this.getOptionsSchema());
        return validator.validate(options);
    }

    normalizeOptions(options) {
        this.validateOptions(options);
        return options;
    }

    mergeOptions(options, inheritOptions) {
        return options || inheritOptions;
    }
}

module.exports = Middleware;
