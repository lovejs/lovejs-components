const _ = require("lodash");
const Event = require("./Event");
const Listener = require("./Listener");
const EmitterError = require("./errors/EmitterError");

class Emitter {
    constructor() {
        this.listeners = {};
    }

    on(eventName, listener) {
        return this.addListener(eventName, listener);
    }

    addListener(eventName, listener) {
        if (!(listener instanceof Listener)) {
            throw new EmitterError("Listener must be instance of Listener");
        }

        if (!this.listeners[eventName]) {
            this.listeners[eventName] = [];
        }

        this.listeners[eventName].push(listener);
        return this;
    }

    getListeners(eventName) {
        return _.sortBy(this.listeners[eventName], ["priority"]);
    }

    clearListeners(eventName = null) {
        if (eventName) {
            this.listeners[eventName] = {};
        } else {
            this.listeners = {};
        }
    }

    async emit(name, data, options = {}) {
        if (!name) {
            throw new EmitterError("You should provide the event name when emitting event");
        }

        _.defaults(options, {
            stopOnReject: true
        });

        const event = new Event(name, data);
        const listeners = this.getListeners(name);

        for (let i = 0; i < listeners.length; i++) {
            const listener = listeners[i];
            event.addListener(listener);

            try {
                const result = await listener.handle(event);
                event.addResult(result);
            } catch (e) {
                console.log(e);
                e.trace = console.trace();
                event.addReject(e);
                if (options.stopOnReject) {
                    break;
                }
            }

            if (event.isStopped()) {
                break;
            }
        }

        return event;
    }
}

module.exports = Emitter;
