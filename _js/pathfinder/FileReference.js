const fs = require("fs");
const path = require("path");
const _ = require("lodash");

const requirableExtensions = [".js", ".json"];

class FileReference {
    constructor(filepath, defaultPath = false) {
        if (!_.isString(filepath) || !path.isAbsolute(filepath)) {
            throw new Error(`FileReference first argument must be an absolute path "${filepath}" given`);
        }
        this.filepath = filepath;
        this.defaultPath = defaultPath;
        this.loaded = false;
        this.content = undefined;
    }

    isRequireable() {
        return requirableExtensions.includes(this.getExtension());
    }

    getDefaultPath() {
        return this.defaultPath;
    }

    getFilePath(relPath = false) {
        return relPath ? path.relative(relPath, this.filepath) : this.filepath;
    }

    getContent(path = false, async = false) {
        if (!this.loaded) {
            this.content = this.isRequireable() ? require(this.filepath) : fs.readFileSync(this.filepath);
            
            if (_.isPlainObject(this.content) && this.content.default) {
                this.content = this.content.default;
            }
            this.loaded = true;
        }

        return path ? _.get(this.content, path) : this.content;
    }

    getDefaultContent(async = false) {
        return this.getContent(this.defaultPath, async);
    }

    getExtension() {
        return path.extname(this.filepath);
    }

    getFileName(stripExtension = false) {
        return path.basename(this.filepath, stripExtension ? this.getExtension() : "");
    }

    getDirectory() {
        return path.dirname(this.filepath);
    }

    getContext() {
        return { cwd: this.getDirectory() };
    }
}

module.exports = FileReference;
