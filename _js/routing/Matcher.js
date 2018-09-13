const _ = require("lodash");
const { Validation } = require("../validation");

class Matcher {
    match(context, options, route) {
        return true;
    }

    getOptionsSchema() {
        return { type: "string" };
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

module.exports = Matcher;
