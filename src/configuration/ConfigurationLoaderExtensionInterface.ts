import { ConfigurationTagList, ConfigurationNormalizer } from ".";

/**
 * ConfigLoaderExtension allows to add tags and normalizers to a config loader
 */
export interface ConfigurationLoaderExtensionInterface {
    /**
     * Return the list of tags to add to the loader
     */
    getTags?(): Promise<ConfigurationTagList>;

    /**
     * Return the list of normalizers to use
     */
    getNormalizers?(): Promise<ConfigurationNormalizer[]>;

    /**
     * Return attributes to merge
     */
    getAttributes?(): Promise<object>;
}
