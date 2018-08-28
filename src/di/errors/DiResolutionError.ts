import { ExtendableError } from "ts-error";

export class DiResolutionError extends ExtendableError {
    protected wrappedError: any;
    constructor(resolution, message, error?) {
        const stack = resolution.isRoot() ? "" : `\nDebug Stack: ${resolution.debugStack()}`;
        super(`Error resolving service "${resolution.getId()}" : ${message} ${error ? error.message : ""} ${stack}`);
        this.wrappedError = error;
    }
}
