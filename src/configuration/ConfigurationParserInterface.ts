/**
 * Config Parser transformer content in supported format into a js tree with ConfigToken instance
 */
export interface ConfigurationParserInterface {
    /**
     * Check if parser supports given file extension (including ".")
     * @param extension The extension to check (exemple: .js, .yml, ...)
     */
    supports(extension: string): boolean;

    /**
     * Parse given data and return corresponding js object
     * @param content
     */
    parse(content: Buffer, tags?: string[], filename?: string): Promise<any>;
}
