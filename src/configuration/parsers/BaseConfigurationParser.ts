import { ConfigurationToken } from "../ConfigurationToken";
import { ConfigurationParserInterface } from "../ConfigurationParserInterface";

/**
 * ConfigParser transform a content in supported format into a js tree with ConfigToken
 */
export abstract class BaseConfigurationParser implements ConfigurationParserInterface {
    /**
     * Parse given data and return corresponding object
     * @param content
     */
    abstract parse(content: Buffer, tags: string[], filename: string): Promise<any>;

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
    getToken(tag: string, data: any): ConfigurationToken {
        return new ConfigurationToken(tag, data);
    }
}
