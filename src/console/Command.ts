import * as _ from "lodash";
import { Output } from "./index";

export abstract class Command {
    protected out: Output;

    constructor() {
        this.out = this.getOutput();
    }

    getOutputStyles?(): any;

    getOutput() {
        const config = { styles: undefined };
        if (this.getOutputStyles) {
            config.styles = this.getOutputStyles();
        }
        return new Output(config);
    }
}
