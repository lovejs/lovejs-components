module.exports = class ConfigExtension {
    constructor(tags, normalizers) {
        this.tags = tags;
        this.normalizers = normalizers;
    }

    getTags() {
        return this.tags;
    }

    getNormalizers() {
        return this.normalizers;
    }
};
