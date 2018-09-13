const _ = require("lodash");
const { isClassInstance, isFunction } = require("../utils");
const Event = require("./Event");
const ListenerError = require("./errors/ListenerError");

class Listener {
    constructor(priority, handler, method, name = false) {
        this.priority = priority;
        this.handler = false;
        this.name = name;

        if (handler) {
            this.setHandler(handler, method);
        }
    }

    getName() {
        return this.name;
    }

    setPriority(priority) {
        this.priority = priority;
    }

    getPriority() {
        return this.priority;
    }

    setHandler(handler, method) {
        if (isFunction(handler)) {
            return (this.handler = handler);
        }

        if (isClassInstance(handler)) {
            if (_.isString(method) && handler[method] && isFunction(handler[method])) {
                return (this.handler = handler[method].bind(handler));
            }
        }

        throw new ListenerError("Listener handler should be a function or class instance with a method name as string");
    }

    async handle(event) {
        if (!this.handler) {
            throw new ListenerError("Listener should have a valid handler before handling events");
        }

        if (!(event instanceof Event)) {
            throw new ListenerError("Listener handle method should receive an Event instance");
        }

        return await this.handler(event);
    }
}

module.exports = Listener;
