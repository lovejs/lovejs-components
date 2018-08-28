import { ConfigTagList, ConfigNormalizer } from "./index";

/**
 * ConfigLoaderExtension allows to add tags and normalizers to a config loader
 */
export interface ConfigLoaderExtension {
    /**
     * Return the list of tags to add to the loader
     */
    getTags?(): Promise<ConfigTagList>;

    /**
     * Return the list of normalizers to use
     */
    getNormalizers?(): Promise<ConfigNormalizer[]>;

    /**
     * Return attributes to merge
     */
    getAttributes?(): Promise<object>;
}
