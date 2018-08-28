/**
 * Alias to anoter service
 */
export class Alias {
    protected service: string;

    constructor(service) {
        this.service = service;
    }

    /**
     * Returns the target service
     */
    getService() {
        return this.service;
    }
}
