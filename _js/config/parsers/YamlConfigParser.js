const yaml = require("js-yaml");
const ConfigTag = require("../ConfigTag");

const kinds = ["scalar", "mapping", "sequence"];

module.exports = class YamlConfigParser {
    constructor(tags) {
        this.tags = tags || null;
    }

    getYamlSchemaTypes() {
        if (!this.tags) {
            return false;
        }

        const types = [];

        for (let type of this.tags) {
            for (let kind of kinds) {
                types.push(new yaml.Type(`!${type}`, { kind, construct: data => new ConfigTag(type, data) }));
            }
        }

        return types;
    }

    getYamlSchema() {
        const types = this.getYamlSchemaTypes();

        if (!types) {
            return undefined;
        }

        return yaml.Schema.create(types);
    }

    parse(content) {
        const schema = this.getYamlSchema();

        return yaml.safeLoad(content, { schema });
    }
};
