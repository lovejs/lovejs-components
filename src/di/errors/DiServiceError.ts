import { ExtendableError } from "ts-error";

export class DiServiceError extends ExtendableError {
    constructor(service, message?) {
        super(`Error for service ${service} ${message}`);
    }
}
