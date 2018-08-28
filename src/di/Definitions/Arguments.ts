/**
 * Arguments for method or constuctor
 */
export class Arguments {
    protected args: any[] = [];

    constructor(args: any[] = []) {
        this.args = args;
    }

    /**
     * Returns the argument at specified index
     * @param index
     */
    get(index: number) {
        return this.args[index] || false;
    }

    /**
     * Replace an argument at given index
     * @param index
     * @param arg
     */
    set(index: number, arg: any) {
        this.args[index] = arg;
    }

    /**
     * Returns the number of arguments
     */
    count() {
        return this.args ? this.args.length : 0;
    }

    /**
     * Return the arguments
     */
    all() {
        return this.args;
    }
}
