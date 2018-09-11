import * as yaml from "js-yaml";
import { BaseConfigurationParser } from "..";

export class YamlConfigurationParser extends BaseConfigurationParser {
    /**
     * @inheritdoc
     */
    supports(extension: string) {
        return [".yaml", ".yml"].includes(extension.toLowerCase());
    }

    /**
     * Transform tag name into custom yaml tags/types with any kind of data
     * Tags are always converted to a mapping type:
     * @see https://github.com/nodeca/js-yaml/wiki/Custom-types
     */
    getYamlSchemaTypes(tags: string[] = []): yaml.Type[] {
        const types = [];
        for (let tag of tags) {
            types.push(new yaml.Type(`!${tag}`, { kind: "scalar", construct: data => this.getToken(tag, data) }));
            types.push(new yaml.Type(`!${tag}`, { kind: "sequence", construct: data => this.getToken(tag, data) }));
            types.push(
                new yaml.Type(`!${tag}`, {
                    kind: "mapping",
                    construct: data => this.getToken(tag, data._ && Object.keys(data).length == 1 ? data._ : data)
                })
            );
        }

        return types;
    }

    /**
     * Instanciate the yaml schema type with the custom yaml tags/types
     * @see https://github.com/nodeca/js-yaml/wiki/Custom-types
     */
    getYamlSchema(tags: string[] = []): yaml.Schema | undefined {
        return yaml.Schema.create(this.getYamlSchemaTypes(tags));
    }

    /**
     * @inheritdoc
     */
    async parse(content: Buffer, tags?: string[], filename?: string): Promise<any> {
        return yaml.safeLoad(content.toString(), { schema: this.getYamlSchema(tags) });
    }
}
