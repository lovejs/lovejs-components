/**
 * Configurator allows to reconfigure service
 */
export class Configurator {
    /**
     * The configurator service
     */
    protected service: string;

    /**
     * The method to call on configurator service
     */
    protected method: string;

    constructor(service: string, method?: string) {
        this.service = service;
        this.method = method;
    }

    /**
     * Return the configuration service
     */
    getService() {
        return this.service;
    }

    /**
     * Return the configurator method
     */
    getMethod() {
        return this.method;
    }

    toString() {
        return this.service + "::" + this.method;
    }
}
