const DiResolutionError = require("./errors/DiResolutionError");

// constructor
// factory
// calls

/*
service a => service a.1 (constructor)
          => service a.2 (constructor)

Resolution -> addChild("constructor", service a.1)
           -> addChild("constructor", service a.2)
*/

class Resolution {
    constructor(serviceId, label = null, parent = null) {
        this.serviceId = serviceId;
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
        return this.getServiceId();
    }

    getServiceId() {
        return this.serviceId;
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
        while(parent) {
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
