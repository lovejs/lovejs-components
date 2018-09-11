import { ExtendableError } from "ts-error";

export class EmitterError extends ExtendableError {
    constructor(message) {
        super(message);
    }
}
