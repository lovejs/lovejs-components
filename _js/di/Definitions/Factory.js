class Factory {
    constructor(service, method) {
        this.service = service;
        this.method = method;
    }

    getService() {
        return this.service;
    }

    getMethod() {
        return this.method;
    }

    toString() {
        return this.service + "::" + this.method;
    }
}
module.exports = Factory;
