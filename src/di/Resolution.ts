import { Service, Call } from "./Definitions";
import { DiResolutionError } from "./errors";

import { ServiceNamePattern } from "./schemas/definitions";

type ChildrenResolution = {
    [label: string]: Resolution;
};

export class Resolution {
    protected serviceId: string;
    protected method: string | null;
    protected parent?: Resolution;
    protected label: string;
    protected children: ChildrenResolution;
    protected depth: number;
    protected service: Service;
    protected instance: any;
    protected calls: Call[];
    protected time: number;

    constructor(serviceId, label = null, parent = null) {
        const parts = serviceId.split(":");
        if (parts.length > 2 || !RegExp(ServiceNamePattern).test(parts[0])) {
            throw new DiResolutionError(
                this,
                `Invalid resolution service specified "${serviceId}". Must be of form "service" or "service:method"`
            );
        }
        this.serviceId = parts[0];
        this.method = parts[1] || null;
        this.parent = parent;
        this.label = label;
        this.children = {};
        this.depth = parent ? parent.getDepth() + 1 : 1;
        this.service = null;
        this.instance = null;
        this.calls = [];
        this.time = +new Date();
    }

    /**
     * Get the resolving service id
     */
    getId() {
        return this.serviceId;
    }

    /**
     * Get the resolving service method
     */
    getMethod() {
        return this.method;
    }

    /**
     * Get the service definition being resolved
     */
    getService() {
        return this.service;
    }

    /**
     * Return the parent resolution
     */
    getParent() {
        return this.parent;
    }

    /**
     * Return list of children resolutions
     */
    getChildren() {
        return this.children;
    }

    /**
     * Add a children resolution based on label and serviceId
     * @param label st
     * @param serviceId
     */
    addChild(label: string, serviceId: string): Resolution {
        const resolution = new Resolution(serviceId, label, this);
        this.children[label] = resolution;

        return resolution;
    }

    /**
     * Get the resolution label (debug purposes)
     */
    getLabel() {
        return this.label;
    }

    /**
     * Return the resolution depth
     */
    getDepth() {
        return this.depth;
    }

    /**
     * Get the resolved instance
     */
    getInstance() {
        return this.instance;
    }

    /**
     * Return the required calls
     */
    getCalls() {
        return this.calls;
    }

    /**
     * Set the method to resolve
     * @param method
     */
    setMethod(method: string) {
        this.method = method;
    }

    /**
     * Set the service definition
     * @param service
     */
    setService(service) {
        this.service = service;
    }

    /**
     * Set the resolved instance
     * @param instance
     */
    setInstance(instance) {
        this.instance = instance;
        this.time = +new Date() - this.time;
    }

    /**
     * Set the required calls after this service resolution
     * @param calls
     */
    setCalls(calls) {
        this.calls = calls;
    }

    /**
     * Check if resolution is root
     */
    isRoot() {
        return this.parent ? false : true;
    }

    /**
     * @XXX ??
     * @param serviceId
     */
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

    /**
     * Retrive the root resolution
     */
    getRoot(): Resolution {
        let r = this as Resolution;
        while (r.getParent()) {
            r = r.getParent();
        }

        return r;
    }

    /**
     * Traverse the resolution stack and apply given callback
     */
    async traverse(callback: (Resolution) => void) {
        await callback(this);
        const children = this.getChildren();

        for (let childname in children) {
            const child = children[childname];
            await child.traverse(callback);
        }
    }

    /**
     * Resolve the related service, by returning the service itself or a wrapper to one of his method
     * @XXX hum
     * @param instance
     */
    resolve(instance) {
        const method = this.getMethod();
        if (!method) {
            return instance;
        }

        if (typeof instance[method] !== "function") {
            throw new DiResolutionError(this, `Resolving method "${method}" of service "${this.getId()}" failed. Method is not a function`);
        }

        return (...a) => instance[method](...a);
    }

    /**
     * Returns the debug resolution stack
     */
    debugStack(): string {
        let resolution = this as Resolution;
        let stack = [];

        while (resolution) {
            let prefix = resolution.getLabel() ? `${resolution.getLabel()} = ` : "";
            stack.push(`${prefix}${resolution.getId()}`);
            resolution = resolution.getParent();
        }

        return stack.reverse().join(" -> ");
    }
}
