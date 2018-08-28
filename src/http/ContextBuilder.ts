import * as _ from "lodash";

export class ContextBuilder {
    protected contextClass;
    protected options;

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
