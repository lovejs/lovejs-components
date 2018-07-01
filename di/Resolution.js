const DiResolutionError = require("./errors/DiResolutionError");

const { ServiceNamePattern } = require("./schemas/definitions");

class Resolution {
    constructor(serviceId, label = null, parent = null) {
        const parts = serviceId.split(":");
        if (parts.length > 2 || !RegExp(ServiceNamePattern).test(parts[0])) {
            throw new DiResolutionError(`Invalid resolution name specified. Must be of form "service" or "service:method"`);
        }
        this.serviceId = parts[0];
        this.method = parts[1] || null;
        this.parent = parent;
        this.label = label;
        this.children = {};
        this.depth = parent ? parent.getDepth() + 1 : 1;
        this.service = null;
        this.instance = null;
        this.calls = false;
        this.time = +new Date();
    }

    getId() {
        return this.serviceId;
    }

    getMethod() {
        return this.method;
    }

    getService() {
        return this.service;
    }

    getParent() {
        return this.parent;
    }

    getLabel() {
        return this.label;
    }

    getChildren() {
        return this.children;
    }

    getDepth() {
        return this.depth;
    }

    getInstance() {
        return this.instance;
    }

    getCalls() {
        return this.calls;
    }

    addChild(label, serviceId) {
        const resolution = new Resolution(serviceId, label, this);
        this.children[label] = resolution;

        return resolution;
    }

    setMethod(method) {
        this.method = method;
    }

    setService(service) {
        this.service = service;
    }

    setInstance(instance) {
        this.instance = instance;
        this.time = +new Date() - this.time;
    }

    setCalls(calls) {
        this.calls = calls;
    }

    isRoot() {
        return this.parent ? false : true;
    }

    hasParent(serviceId) {
        let parent = this.getParent();
        while (parent) {
            if (parent.getId() == serviceId) {
                return true;
            }
            parent = parent.getParent();
        }

        return false;
    }

    getRoot() {
        let r = this;
        while (r.getParent()) {
            r = r.getParent();
        }

        return r;
    }

    async traverse(callback) {
        await callback(this);
        const children = this.getChildren();

        for (let childname in children) {
            const child = children[childname];
            await child.traverse(callback);
        }
    }

    resolve(instance) {
        const method = this.getMethod();
        if (!method) {
            return instance;
        }

        if (typeof instance[method] !== "function") {
            throw new DiResolutionError(`Resolving method "${method}" of service "${this.getId()}" failed. Method is not a function`);
        }

        return (...a) => instance[method](...a);
    }

    debugStack() {
        let obj = this;
        let stack = [];

        while (obj) {
            let prefix = obj.getLabel() ? `${obj.getLabel()} = ` : "";
            stack.push(`${prefix}${obj.getId()}`);
            obj = obj.getParent();
        }

        return stack.reverse().join(" -> ");
    }
}

module.exports = Resolution;
