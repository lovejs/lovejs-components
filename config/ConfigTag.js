class ConfigTag {
    constructor(type, data) {
        this.type = type;
        this.data = data;
    }

    getType() {
        return this.type;
    }

    getData() {
        return this.data;
    }

    setData(data) {
        this.data = data;
    }
}

module.exports = ConfigTag;
