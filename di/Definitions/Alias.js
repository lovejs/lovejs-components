module.exports = class Alias {
    constructor(target) {
        this.target = target;
    }

    getService() {
        return this.target;
    }
}
