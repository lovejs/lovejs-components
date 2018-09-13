import * as _ from "lodash";
import { Output } from "./index";

export abstract class Command {
    /**
     * Command output
     */
    protected output: Output;

    constructor() {
        const config = { styles: undefined };
        if (this.getOutputStyles) {
            config.styles = this.getOutputStyles();
        }

        this.output = new Output(config);
    }

    getOutputStyles?(): any;
}
