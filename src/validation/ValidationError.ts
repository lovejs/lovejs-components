import { ExtendableError } from "ts-error";

export class ValidationError extends ExtendableError {
    protected errors: [];

    constructor(errors) {
        const errorsList = errors.map(e => `At path "${e.dataPath}" ${e.message} (${JSON.stringify(e.params)})`).join("\n");
        super(errorsList);
        this.errors = errors;
    }

    /**
     * Return validation errors
     */
    getErrors() {
        return this.errors;
    }
}
