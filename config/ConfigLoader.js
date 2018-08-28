const _ = require("lodash");
const path = require("path");
const JSONPath = require("jsonpath-plus");

const { Validation } = require("../validation");
const { PathFinder } = require("../pathfinder");
const { deepMapValues } = require("../utils");

const ConfigError = require("./errors/ConfigError");
const JsConfigParser = require("./parsers/JsConfigParser");
const YamlConfigParser = require("./parsers/YamlConfigParser");
const ConfigExtension = require("./ConfigExtension");
const ConfigTag = require("./ConfigTag");
const TemplateTag = require("./TemplateTag");

const defaultTags = {
    template: {
        schema: { type: "string" },
        normalize: (template, vars) => {
            const tpl = _.template(template);
            try {
                return tpl(vars);
            } catch (e) {
                throw new Error(`Error resolving template tag ${e.message}`);
            }
        }
    },
    configuration: {
        schema: { type: "object" },
        normalize: (data, vars, loader) => {
            return loader.clone().loadFile(path.join(data.path, data.file));
        }
    },
    js: {
        schema: { type: "string" },
        normalize: js => eval(js)
    }
};

const importsSchema = {
    type: "array",
    items: {
        oneOf: [
            { type: "string" },
            {
                type: "object",
                required: ["path"],
                properties: {
                    path: { type: "string" },
                    glob: { type: "string" },
                    merge: { enum: ["root", "filename"] }
                }
            }
        ]
    }
};

const defaultNormalizers = [];
const getError = (file, message) => {
    return new ConfigError(file ? file.getFilePath() : null, message);
};

class ConfigLoader {
    constructor(options = {}) {
        const { pathfinder, extensions = [] } = options;
        this.pathfinder = pathfinder || new PathFinder();
        this.tags = defaultTags;
        this.normalizers = defaultNormalizers;
        this.schema = false;
        this.tagValidators = {};
        this.currentFile = false;
        this.templateVars = {};

        for (let extension of extensions) {
            this.addExtension(extension);
        }
    }

    getCurrentFile(asContext = false) {
        if (!this.currentFile) {
            return asContext ? {} : false;
        }

        return asContext ? this.currentFile.getContext() : this.currentFile;
    }

    addExtension(configExtension) {
        if (!(configExtension instanceof ConfigExtension)) {
            throw new Error(`ConfigLoader addExtension expect a ConfigExtension as parameter`);
        }

        _.merge(this.tags, configExtension.getTags());
        this.normalizers = _.concat(this.normalizers, configExtension.getNormalizers());
        if (_.isFunction(configExtension.getTemplateVars)) {
            _.merge(this.templateVars, configExtension.getTemplateVars());
        }
    }

    getParser(filename) {
        const tags = _.keys(this.getTags());
        const extension = path.extname(filename);
        switch (extension) {
            case "":
            case ".js":
                return new JsConfigParser(tags);
            case ".yml":
            case ".yaml":
                return new YamlConfigParser(tags);
            default:
                throw getError(filename, `ConfigLoader was unable to find a parser for file ${filename} with extension ${extension}`);
        }
    }

    getSchema() {
        return this.schema;
    }

    getValidator() {
        return this.getSchema() ? new Validation(this.getSchema()) : false;
    }

    getTags() {
        return this.tags;
    }

    getTag(type) {
        return _.get(this.getTags(), type);
    }

    getTagValidator(type) {
        if (!_.has(this.tagValidators, type)) {
            this.tagValidators[type] = new Validation(this.getTag(type).schema);
            this.tagValidators[type].registerInstanceClass("ConfigTag", ConfigTag);
        }

        return _.get(this.tagValidators, type);
    }

    validateTag(configTag, path) {
        const tagValidator = this.getTagValidator(configTag.getType());
        try {
            tagValidator.validate(configTag.getData());
        } catch (e) {
            throw getError(this.getCurrentFile(), `\nAt path "${path}", invalid tag "${configTag.getType()}" usage ${e.message}`);
        }
    }

    validateTags(data) {
        deepMapValues(data, (v, p) => {
            if (v instanceof ConfigTag) {
                this.validateTag(v, p);
            }
        });
    }

    getTagNormalizer(type) {
        return this.getTag(type).normalize;
    }

    isTagDeep(type) {
        return !(this.getTag(type).deep === false);
    }

    normalizeTag(tag, vars = {}) {
        if (!(tag instanceof ConfigTag)) {
            throw new Error("Normalize Tag expect a ConfigTag object");
        }
        const tagNormalizer = this.getTagNormalizer(tag.getType());

        return tagNormalizer.apply(this, [tag.getData(), vars, this]);
    }

    normalizeTags(data, vars = {}) {
        return deepMapValues(data, v => {
            if (v instanceof ConfigTag) {
                if (this.isTagDeep(v.getType())) {
                    v.setData(this.normalizeTags(v.getData(), vars));
                }
                return this.normalizeTag(v, vars);
            } else {
                return v;
            }
        });
    }

    getNormalizers() {
        return this.normalizers;
    }

    applyNormalizer(normalizer, data, vars) {
        const entries = JSONPath({ json: data, path: normalizer.path, resultType: "all" });
        for (let entry of entries) {
            let { path, value, parent, parentProperty } = entry;
            path = path.slice(1);
            _.set(data, path, normalizer.normalize(value, vars));
        }
    }

    loadImports(data) {
        if (!_.has(data, "imports")) {
            return [];
        }

        const imps = _.get(data, "imports");
        const validator = new Validation(importsSchema);

        try {
            validator.validate(imps);
        } catch (e) {
            throw getError(this.getCurrentFile(), `\nInvalid "imports" key provided. ${e.message}`);
        }

        return _.map(imps, imp => {
            let path;
            let merge = "root";

            if (_.isString(imp)) {
                path = imp;
            } else if (_.isPlainObject(imp)) {
                path = imp.path;
                if (imp.merge) {
                    merge = imp.merge;
                }
            }

            path = this.pathfinder.resolvePath(path, this.currentFile.getContext(true));
            let type = this.pathfinder.getPathType(path);
            if (!type) {
                throw getError(this.getCurrentFile(), `\nThe path ${path} in the imports directive is neither a file nor a directory`);
            }

            let files;
            if (type == "file") {
                files = [this.pathfinder.get(path)];
            } else if (type == "directory") {
                const fromPath = this.pathfinder.resolvePath(path, this.currentFile.getContext(true));
                files = this.pathfinder.mget(imp.glob || "*.{js,yml,yaml}", { cwd: fromPath });
            } else {
                return {};
            }

            let config = {};
            files.forEach(file => {
                let key;
                switch (merge) {
                    case "filename":
                        key = file.getFileName(true);
                        break;
                }

                const data = this.clone().loadFile(file.getFilePath());
                let dataObject = {};
                if (key) {
                    dataObject[key] = data;
                } else {
                    dataObject = data;
                }

                _.merge(config, dataObject);
            });

            return config;
        });
    }

    loadFile(filepath, context = {}) {
        const parser = this.getParser(filepath);
        const file = this.pathfinder.get(filepath, context);
        this.currentFile = file;

        return this.load(file.getContent(), parser);
    }

    load(content, parser = null, vars = {}, validator = null) {
        let data;
        if (parser) {
            try {
                data = parser.parse(content);
            } catch (e) {
                throw getError(this.getCurrentFile(), e.message);
            }
        } else {
            data = content;
        }

        let configs = this.loadImports(data);

        data = this.transform(data);
        this.validateTags(data);
        data = this.normalizeTags(data, vars);
        data = this.validate(data, validator);
        data = this.normalize(data);

        configs.push(_.omit(data, "imports"));

        let config = {};
        for (let c of configs) {
            _.merge(config, c);
        }

        return config;
    }

    transform(data) {
        return data;
    }

    validate(data, validator = false) {
        validator = validator || this.getValidator();
        if (validator) {
            try {
                return validator.validate(data);
            } catch (e) {
                console.log(">", e.errors[0].params.errors);
                throw getError(this.getCurrentFile(), e.message);
            }
        }

        return data;
    }

    normalize(data) {
        for (let normalizer of this.getNormalizers()) {
            this.applyNormalizer(normalizer, data);
        }

        return data;
    }

    clone() {
        return Object.assign(Object.create(Object.getPrototypeOf(this)), this);
    }

    resolveTemplateTags(data, vars = {}) {
        const variables = { ...this.getTemplateVars(), ...vars };
        const mapTemplates = data => {
            return deepMapValues(data, v => {
                if (v instanceof TemplateTag) {
                    return v.resolve(variables);
                } else if (v instanceof ConfigTag) {
                    v.setData(mapTemplates(v.getData()));
                    return v;
                } else {
                    return v;
                }
            });
        };

        return mapTemplates(data);
    }

    getTemplateVars() {
        return this.templateVars;
    }
}

module.exports = ConfigLoader;
