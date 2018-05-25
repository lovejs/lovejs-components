const _ = require("lodash");

class Tag {
    constructor(name, data) {
        this.name = name;
        this.data = data;
    }

    getName() {
        return this.name;
    }

    getData(key = null) {
        return key ? _.get(this.data, key) : this.data;
    }

    toString() {
        return `tag-${this.name}`;
    }
}

module.exports = Tag;
