const _ = require("lodash");

class ContextBuilder {
    constructor(contextClass, extensions = [], options) {
        for (let extension of extensions) {
            contextClass = extension.register(contextClass);
        }

        this.contextClass = contextClass;
        this.options = options;
    }

    getContextClass() {
        return this.contextClass;
    }

    getContext(request, response) {
        const ContextClass = this.getContextClass();

        return new ContextClass(request, response, this.options);
    }
}

module.exports = ContextBuilder;
