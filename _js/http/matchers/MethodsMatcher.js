const _ = require("lodash");
const { Matcher } = require("../../routing");

class MethodsMatcher extends Matcher {
    match(context, methods, route) {
        return methods.includes(context.method);
    }

    getOptionsSchema() {
        const methods = ["GET", "HEAD", "POST", "PUT"];
        return {
            oneOf: [{ enum: methods }, { type: "array", items: { enum: methods } }]
        };
    }

    normalizeOptions(options) {
        return _.isArray(options) ? options : [options];
    }
}

module.exports = MethodsMatcher;
