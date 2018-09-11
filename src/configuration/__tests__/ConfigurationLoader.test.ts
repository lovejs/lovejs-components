import { ConfigurationToken as CT, ConfigurationTag, ConfigurationError } from "..";
import { ConfigurationNormalizer, ConfigurationTagList, ConfigurationLoader } from "../ConfigurationLoader";
import { ConfigurationLoaderExtensionInterface } from "../ConfigurationLoaderExtensionInterface";
import { ConfigurationToken } from "../ConfigurationToken";

const getTag = (name: string, schema?: object): { [tag: string]: ConfigurationTag } => ({
    [name]: {
        schema: schema ? schema : { type: "string" },
        normalize: async a => `${name}_${a}`
    }
});

describe("#Config [Loader] - Normalize Tags", function() {
    it("should resolve simple Config Token", async () => {
        const configuration = { a: new CT("tag1", "tag1") };
        const loader = new ConfigurationLoader({ tags: { ...getTag("tag1") } });
        const config = await loader.loadConfig(configuration);

        expect(config).toMatchObject({ a: "tag1_tag1" });
    });

    it("should resolve nested Config Tokens", async () => {
        const configuration = {
            a: new CT("tag1", "data"),
            b: new CT("tag1", new CT("tag2", new CT("tag3", "hello")))
        };
        const loader = new ConfigurationLoader({ tags: { ...getTag("tag1"), ...getTag("tag2"), ...getTag("tag3") } });
        const config = await loader.loadConfig(configuration);

        expect(config).toMatchObject({ a: "tag1_data", b: "tag1_tag2_tag3_hello" });
    });

    it("should failed with incorrect tag data", async () => {
        const configuration = { a: new CT("tag1", ["a"]) };
        const loader = new ConfigurationLoader({ tags: { ...getTag("tag1") } });
        const check = async () => await loader.loadConfig(configuration);
        await expect(check()).rejects.toThrow(ConfigurationError);
    });
});

describe("#Config [Loader] - Validate", function() {
    it("should succeed with correct schema", async () => {
        const configuration = { a: "a" };
        const schema = { type: "object", properties: { a: { type: "string" } } };
        const loader = new ConfigurationLoader({ schema });
        const config = await loader.loadConfig(configuration);
    });

    it("should failed with default validator and invalid data", async () => {
        const configuration = { a: ["a"] };
        const schema = { type: "object", properties: { a: { type: "string" } } };
        const loader = new ConfigurationLoader({ schema });
        const check = async () => await loader.loadConfig(configuration);
        await expect(check()).rejects.toThrow(ConfigurationError);
    });
});

describe("#Config [Loader] - Normalizers", function() {
    it("should use simple normalizer", async () => {
        const configuration = { a: ["a", "b", "c"], b: "b" };
        const normalizers: ConfigurationNormalizer[] = [
            { path: "a", normalize: async data => data.join(",") },
            { path: "b", normalize: async data => 123 }
        ];

        const loader = new ConfigurationLoader({ normalizers });
        const config = await loader.loadConfig(configuration);
        expect(config).toMatchObject({ a: "a,b,c", b: 123 });
    });

    it("should normalize deepest properties first regardless declaration order", async () => {
        const configuration = {
            a: {
                b: {
                    c: "a"
                }
            }
        };
        const normalizers: ConfigurationNormalizer[] = [
            { path: "a", normalize: async data => JSON.stringify(data) },
            { path: "a.*.c", normalize: async () => "coucou" },
            { path: "*.b", normalize: async data => ({ ...data, new: 123 }) }
        ];

        const loader = new ConfigurationLoader({ normalizers });
        const config = await loader.loadConfig(configuration);
        expect(config).toMatchObject({ a: JSON.stringify({ b: { c: "coucou", new: 123 } }) });
    });
});

describe("#Config [Loader] - Extensions", function() {
    it("should accept extension in constructor", async () => {
        const extension: ConfigurationLoaderExtensionInterface = {
            async getTags() {
                return {
                    tag_extension: {
                        schema: {},
                        normalize: async data => "extension_tag"
                    }
                };
            },

            async getAttributes() {
                return {
                    attribute_extension: "test"
                };
            },

            async getNormalizers() {
                return [{ path: "b", normalize: async data => "extension_normalized" }];
            }
        };

        const loader = new ConfigurationLoader({ extensions: [extension] });
        const config = await loader.loadConfig({
            a: new ConfigurationToken("tag_extension"),
            b: "test"
        });

        expect(config).toMatchObject({ a: "extension_tag", b: "extension_normalized" });
    });
});

describe("#Config [Loader] - Tags: template, configuration, js", function() {});
