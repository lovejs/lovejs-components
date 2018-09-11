import * as _ from "lodash";
import { Event, Listener, EmitterError } from ".";

export type ListenersMap = {
    [eventName: string]: Listener[];
};

export class EventDispatcher {
    /**
     * Map of listeners by event name
     */
    protected listeners: ListenersMap = {};

    /**
     * Alias to addListener
     */
    on(eventName: string, listener: Listener) {
        return this.addListener(eventName, listener);
    }

    /**
     * Add an event listener for given event name
     * @param eventName
     * @param listener
     */
    addListener(eventName: string, listener: Listener): this {
        if (!(listener instanceof Listener)) {
            throw new EmitterError("Listener must be instance of Listener");
        }

        if (!this.listeners[eventName]) {
            this.listeners[eventName] = [];
        }

        this.listeners[eventName] = _.sortBy([...this.listeners[eventName], listener], ["priority"]);

        return this;
    }

    /**
     * Get listeners for this event name
     *
     * @param eventName
     */
    getListeners(eventName: string) {
        return this.listeners[eventName];
    }

    /**
     * Clear all listeners or listeners for given event name
     *
     * @param eventName
     */
    clearListeners(eventName?: string) {
        if (eventName) {
            delete this.listeners[eventName];
        } else {
            this.listeners = {};
        }
    }

    /**
     * Emit an event by name and data
     * @param eventName The name of the event
     * @param data Data or an event instance
     * @param options { stopOnReject : to stop listeners chains if an event throw an error }
     */
    async emit(eventName: string, data?: any, options: { stopOnReject: boolean } = { stopOnReject: true }) {
        if (!eventName) {
            throw new EmitterError("You should provide the event name when emitting event");
        }

        //dzedze;

        /**
            Un event n'a pas besoin de connaitre l'évènement qui l'a déclenché 
            quand j'emit, je peux soit filer des datas, soit une instance d'event
            - Un event n'est pas supposé reject avec une exception (exception = erreur dans la stack = données potentiellement plus intègres)
        */

        const event = new Event(eventName, data);
        const listeners = this.getListeners(eventName);

        for (let i = 0; i < listeners.length; i++) {
            const listener = listeners[i];
            event.addListener(listener); // Est-ce que l'event a besoin de connaitre ses listeners ??

            try {
                event.addResult(await listener.handle(event));
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
