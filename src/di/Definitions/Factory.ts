/**
 * Factory create service
 */
export class Factory {
    /**
     * The factory service
     */
    protected service: string;

    /**
     * The method on the factory service
     */
    protected method: string;

    constructor(service: string, method?: string) {
        this.service = service;
        this.method = method;
    }

    /**
     * Return the factory service
     */
    getService() {
        return this.service;
    }

    /**
     * Return the factory method
     */
    getMethod() {
        return this.method;
    }

    toString() {
        return this.service + "::" + this.method;
    }
}
