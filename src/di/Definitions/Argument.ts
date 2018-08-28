/**
 * Constructor, function or method argument
 */
export class Argument {
    protected type: string;
    protected value;
    protected options;

    constructor(type, value, options = {}) {
        this.type = type;
        this.value = value;
        this.options = options;
    }

    /**
     * Get the argument type
     */
    getType() {
        return this.type;
    }

    /**
     * Get the argument value
     */
    getValue() {
        return this.value;
    }

    /**
     * Set the argument value
     * @param value
     */
    setValue(value) {
        this.value = value;
    }

    /**
     * Get the options
     */
    getOptions() {
        return this.options;
    }

    /**
     * To string for debug purpose
     */
    toString() {
        return this.type + "::" + this.value;
    }
}
