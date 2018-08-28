import * as _ from "lodash";
import * as path from "path";
import * as JSONPath from "jsonpath-plus";

import { Validator, ValidatorInterface } from "../validation";

import { deepMapValuesAsync as deepMapValues } from "../utils";

import { ConfigLoaderExtension, ConfigToken, ConfigError, ConfigParser, ConfigPathResolver } from "./index";
import { YamlConfigParser, JsConfigParser } from "./index";
import { importsSchema } from "./schemas";
import { LocalPathResolver } from "./resolvers/LocalPathResolver";

/**
 *  @todo Better errors
 */

// Config Loader

// Add parser
// Add tags
// Add normalizers

// 1. parse         Data => Json with ConfigToken
// 2. transform     Modify original data
// 3. apply_tags    Normalize / Validate ConfigToken from Tags
// 4. validate      Validate the resulting data from validation schema
// 5. normalize     Normalize data from path & normalizer to turn things into class or other things

const defaultParsers: ConfigParser[] = [new JsConfigParser(), new YamlConfigParser()];

const defaultTags: ConfigTagList = {
    template: {
        schema: { type: "string" },
        normalize: async (data: string) => {
            const tpl = _.template(data);
            try {
                return tpl();
            } catch (e) {
                throw new Error(`Error resolving template tag ${e.message}`);
            }
        }
    },
    configuration: {
        schema: { type: "string" },
        normalize: async (data: object) => {
            return await this.loadFile(data, this.getCurrentFile());
        }
    },
    js: {
        schema: { type: "string" },
        normalize: (data: "string") => eval(data)
    }
};

const getError = (file, message) => {
    return new ConfigError(file ? file.getFilePath() : null, message);
};

/**
 * A config tag is define by a validation schema of his data
 * and a normalize method to transform the tag into a js
 */
export interface ConfigTag {
    /**
     * A json schema to validate the tag data using the built-in validator
     */
    schema?: object;

    /**
     * A optionnal validation function
     */
    validate?: (data: any) => Promise<boolean>;

    /**
     * The normalization function
     * @param data The tag's data
     * @param vars Variables
     * @param loader The config Loader
     */
    normalize(data: any, vars?: any): Promise<object | string>;
}

/**
 * A map of config tags
 */
export interface ConfigTagList {
    [s: string]: ConfigTag;
}

/**
 * A normalizer
 */
export interface ConfigNormalizer {
    /**
     * Json path to lookup to
     */
    path: string;

    /**
     * Normalization function of data at specified json path
     * @param data The data at path
     * @param vars Additionnal vars
     */
    normalize(data: any, vars?: object): Promise<any>;
}

export enum ImportMergeType {
    root,
    filename
}

export type ConfigLoaderOptions = {
    extensions?: ConfigLoaderExtension[];
    parsers?: ConfigParser[];
    pathResolver?: ConfigPathResolver;
    validator?: ValidatorInterface;
    schema?: object;
    tags?: ConfigTagList;
    normalizers?: ConfigNormalizer[];
    attributes?: object;
};

/**
 * The config loader, to load... well.. config :)
 */
export class ConfigLoader {
    /**
     * Config Loader extensions
     */
    protected extensions: ConfigLoaderExtension[];

    /**
     * Indicate if extensions have been loaded
     */
    protected extensionsLoaded: boolean;

    /**
     * Path finder service to lookup for files
     */
    protected pathResolver: ConfigPathResolver;

    /**
     * Validator service to validate imports and tags schemas
     */
    protected validator: ValidatorInterface;

    /**
     * File parsers to transform file into js objects
     */
    protected parsers: ConfigParser[];

    /**
     * Map of normalizable tags
     */
    protected tags: ConfigTagList;

    /**
     * List of normalizers
     */
    protected normalizers: ConfigNormalizer[];

    /**
     * Validation schema
     */
    protected schema?: object;

    /**
     * Processed files
     */
    protected files?: string[];

    /**
     * Attributes passed to tag normalizes and config normalizers
     */
    protected attributes?: object;

    constructor(options: ConfigLoaderOptions = {}) {
        const {
            extensions = [],
            parsers = defaultParsers,
            pathResolver = new LocalPathResolver(),
            validator = new Validator(),
            schema,
            tags = defaultTags,
            normalizers = [],
            attributes = {}
        } = options;

        this.pathResolver = pathResolver;
        this.validator = validator;
        this.schema = schema;
        this.tags = tags;
        this.normalizers = normalizers;
        this.extensions = extensions;
        this.parsers = [];
        this.files = [];
        this.attributes = attributes;

        parsers.forEach(parser => this.addParser(parser));
    }

    /**
     * Get the file parsers
     */
    getParsers(): ConfigParser[] {
        return this.parsers;
    }

    /**
     * Set the config parsers
     * @param parsers array of ConfigParser
     */
    setParsers(parsers: ConfigParser[]) {
        this.parsers = parsers;
    }

    /**
     * Add a config parser
     * @param parser
     */
    addParser(parser: ConfigParser) {
        this.parsers = [parser, ...this.parsers];
    }

    /**
     * Get attributes
     */
    getAttributes(): object {
        return this.attributes;
    }

    /**
     * Set the attributes
     * @param attributes
     */
    setAttributes(attributes: object) {
        this.attributes = attributes;
    }

    /**
     * Return the list of configured tags
     */
    getTags() {
        return this.tags;
    }

    /**
     * Return the list of tags names
     */
    getTagsNames() {
        return _.keys(this.getTags());
    }

    /**
     * Return tag specified by given name
     * @param name The tag name
     */
    getTag(name: string): ConfigTag {
        const tag = _.get(this.getTags(), name);
        if (!tag) {
            throw getError(this.getCurrentFile(), `\n Invalid tag specified : ${name}`);
        }
        return tag;
    }

    /**
     * Get the normalizers
     */
    getNormalizers() {
        return this.normalizers;
    }

    /**
     * Return the currently processed file
     */
    getCurrentFile() {
        return _.last(this.files);
    }

    /**
     * Load loader extensions
     */
    async loadExtensions() {
        if (!this.extensionsLoaded) {
            for (let extension of this.extensions) {
                await this.addExtension(extension);
            }

            this.extensionsLoaded = true;
        }
    }

    /**
     * Add an extension to the config loader
     * merge tags, normalizers and attributes
     *
     * @param extension The extension to add
     */
    async addExtension(extension: ConfigLoaderExtension) {
        if (extension.getTags) {
            const tags = await extension.getTags();
            this.tags = { ...this.tags, ...tags };
        }

        if (extension.getNormalizers) {
            const normalizers = await extension.getNormalizers();
            this.normalizers = [...this.normalizers, ...normalizers];
        }

        if (extension.getAttributes) {
            const attributes = await extension.getAttributes();
            this.attributes = { ...this.attributes, ...attributes };
        }
    }

    /**
     * Get parser for given filename
     * @param filename
     */
    getParser(filename: string) {
        const extension = path.extname(filename);
        const parsers = this.getParsers();
        for (let parser of parsers) {
            if (parser.supports(extension)) {
                return parser;
            }
        }

        throw getError(filename, `ConfigLoader was unable to find a parser for file ${filename} with extension ${extension}`);
    }

    /**
     * Normalize a tag from given token
     * @param token The config token
     * @param tokenPath The json path of the token
     * @param vars Additionnal parameters pass to normalizer
     */
    async normalizeTag(token: ConfigToken, tokenPath: string, vars: object = {}) {
        const tag = this.getTag(token.getTag());
        const { normalize, validate, schema } = tag;
        try {
            if (validate) {
                await validate(token.getData());
            } else if (schema) {
                await this.validator.validate(token.getData(), schema);
            }
        } catch (e) {
            throw getError(this.getCurrentFile(), `\nAt path "${tokenPath}", invalid data for tag "${token.getTag()}" ${e.message}`);
        }

        return await normalize.apply(this, [token.getData(), vars]);
    }

    /**
     * Normalize the tags in data
     * @param data
     * @param type if set, normalize only tags of this type
     * @param vars Additionnal parameters pass to normalizer
     */
    async normalizeTags(data: object, type?: string, vars: object = {}) {
        return await deepMapValues(data, async (value, path) => {
            if (value instanceof ConfigToken && (!type || value.getTag() == type)) {
                value.setData(await this.normalizeTags(value.getData(), type, vars));
                return await this.normalizeTag(value, path, vars);
            } else {
                return value;
            }
        });
    }

    /**
     * Load imports entries
     * @param data
     */
    protected async loadImports(data: { imports?: any[] }) {
        if (!data.imports) {
            return [];
        }

        try {
            await this.validator.validate(data.imports, importsSchema);
        } catch (e) {
            throw getError(this.getCurrentFile(), `\nInvalid "imports" section provided. ${e.message}`);
        }

        return Promise.map(data.imports, async importLine => {
            if (_.isString(importLine)) {
                importLine = { path: importLine };
            }
            const { path: importPath, merge = "root", query } = importLine;

            const filepaths = await this.pathResolver.resolveImport(importPath, query, this.getCurrentFile());

            for (let { filePath, fileName } of filepaths) {
                const importConfig = await this.loadFile(filePath, this.getCurrentFile());
                switch (merge) {
                    case "root":
                        data = { ...data, ...importConfig };
                        break;
                    case "filename":
                        data = { ...data, ...{ [fileName]: importConfig } };
                }
            }
        });
    }

    /**
     * Load a file and returns the corresponding config object
     * @param filePath The file path to load
     * @param parentPath The parent file importing the file
     */
    async loadFile(filepath: string, parentPath?: string) {
        const content = await this.pathResolver.getContent(filepath, parentPath);
        this.files.push(filepath);
        const res = await this.loadContent(content.toString(), this.getParser(filepath));
        this.files.pop();
        return res;
    }

    /**
     * Load content with given parser
     * @param content
     * @param parser
     */
    async loadContent(content: string, parser: ConfigParser) {
        let data: any;
        try {
            data = await parser.parse(content, this.getTagsNames());
        } catch (e) {
            throw getError(this.getCurrentFile(), e.message);
        }

        return await this.loadConfig(data);
    }

    /**
     * Load config data
     * @param content
     * @param parser
     * @param vars
     * @param validator
     */
    async loadConfig(data: any): Promise<any> {
        await this.loadExtensions();
        let configs = await this.loadImports(data);

        data = await this.transform(data);
        data = await this.normalizeTags(data);
        data = await this.validate(data);
        data = await this.normalize(data);

        configs.push(_.omit(data, "imports"));

        let config = {};
        for (let c of configs) {
            _.merge(config, c);
        }

        return config;
    }

    /**
     * Transform the data
     * @param data
     */
    protected async transform(data: object): Promise<object> {
        return data;
    }

    /**
     * Validate the given data using the validator
     *
     * @param data Data to validate
     * @param validator Use this validator instead of the default one
     */
    protected async validate(data: object, validator?: ValidatorInterface): Promise<object> {
        if (this.schema) {
            validator = validator || this.validator;
            try {
                return await validator.validate(data, this.schema);
            } catch (e) {
                throw getError(this.getCurrentFile(), e.message);
            }
        }

        return data;
    }

    /**
     * Normalize the data using the configured normalizers
     * The deepest properties are normalized first
     *
     * @param data object
     */
    protected async normalize(data: any): Promise<object> {
        let properties: { path; value; normalize }[] = [];

        for (let normalizer of this.getNormalizers()) {
            const { path: jsonPath, normalize } = normalizer;
            const entries = JSONPath({ json: data, path: jsonPath, resultType: "all" });
            for (let entry of entries) {
                let { path, value } = entry;
                path = path.slice(1);
                properties.push({ path, value, normalize });
            }
        }

        properties = _.orderBy(properties, "path.length", ["desc"]);

        for (let property of properties) {
            _.set(data, property.path, await property.normalize.apply(this, [property.value]));
        }

        return data;
    }

    /**
     * Clone the current config loader
     */
    clone(): ConfigLoader {
        return Object.assign(Object.create(Object.getPrototypeOf(this)), this);
    }
}
