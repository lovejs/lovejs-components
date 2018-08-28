import { ExtendableError } from "ts-error";

export class ConfigError extends ExtendableError {
    constructor(message: string, file?: string) {
        super(`Configuration error ${file ? `in file "${file}"` : ""} : ${message}`);
    }
}
