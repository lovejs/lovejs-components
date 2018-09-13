import { ExtendableError } from "ts-error";

export class ConfigurationError extends ExtendableError {
    /**
     * File where error happens if any
     */
    protected file?: string;

    /**
     * Path of the error in the file
     */
    protected path?: string;

    /**
     * Wrapped error
     */
    protected error?: Error;

    constructor(message: string, { file, path, error }: { file?: string; path?: string; error?: Error }) {
        super(`Configuration error ${file ? `in file "${file}"` : ""} ${path ? `at path "${path}"` : ""}: ${message}`);
        this.file = file;
        this.path = path;
        this.error = error;
    }

    getFile() {
        return this.file;
    }

    getPath() {
        return this.path;
    }

    getError() {
        return this.error;
    }
}
