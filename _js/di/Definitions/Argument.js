class Argument {
    constructor(type, value, options = {}) {
        this.type = type;
        this.value = value;
        this.options = options;
    }

    getType() {
        return this.type;
    }

    getValue() {
        return this.value;
    }

    setValue(value) {
        this.value = value;
    }

    getOptions() {
        return this.options;
    }

    toString() {
        return this.type + "::" + this.value;
    }
}

module.exports = Argument;
