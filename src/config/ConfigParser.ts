import { ConfigToken } from "./ConfigToken";

/**
 * ConfigParser transform a content in supported format into a js tree with ConfigToken
 */
export abstract class ConfigParser {
    /**
     * Parse given data and return corresponding object
     * @param content
     */
    abstract parse(content: string, tags: string[]): any;

    /**
     * Check if parser supports given file extension
     * @param extension
     */
    abstract supports(extension: string): boolean;

    /**
     * Returns a ConfigToken
     * @param tag The tag name
     * @param data The associated data
     */
    getToken(tag: string, data: any): ConfigToken {
        return new ConfigToken(tag, data);
    }
}
