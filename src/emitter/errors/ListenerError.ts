import { ExtendableError } from "ts-error";

export class ListenerError extends ExtendableError {
    constructor(message) {
        super(message);
    }
}
