/**
 * Call to a service method
 */
export class Call {
    /**
     * Name of the method to call
     */
    protected method: string;

    /**
     * Arguments to perform the call with
     */
    protected arguments: any[];

    protected await;

    constructor(method, args = [], doAwait = true) {
        this.method = method;
        this.arguments = args;
        this.await = doAwait;
    }

    /**
     * Return the method to call
     */
    getMethod() {
        return this.method;
    }

    /**
     * Return the call arguments
     */
    getArguments() {
        return this.arguments;
    }

    /**
     * @todo hum hum ...
     */
    getAwait() {
        return this.await;
    }

    toString() {
        return this.method;
    }
}
