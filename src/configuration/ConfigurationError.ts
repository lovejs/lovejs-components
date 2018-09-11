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

    constructor(message: string, { file, path }: { file?: string; path?: string }) {
        super(`Configuration error ${file ? `in file "${file}"` : ""} ${path ? `at path "${path}"` : ""}: ${message}`);
        this.file = file;
        this.path = path;
    }

    getFile() {
        return this.file;
    }

    getPath() {
        return this.path;
    }
}
