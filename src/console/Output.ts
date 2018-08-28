import * as _ from "lodash";
import { deepMapValues } from "../utils";
import { stylize, emojize } from "./transformers";

const { table, getBorderCharacters } = require("table");
const progress = require("cli-progress");

type Transformer = (input: string) => string;

export class Output {
    protected silent: boolean;
    protected tableTheme: string;
    protected styles: object;
    protected transformers: Transformer[];

    constructor({ silent = false, styles = {}, tableTheme = "void", transformers = [] } = {}) {
        this.silent = silent;
        this.tableTheme = tableTheme;
        this.styles = Object.assign(
            {
                error: { fg: "whiteBright", bg: "redBright" },
                info: { fg: "blueBright" },
                success: { fg: "greenBright" },
                comment: { fg: "cyan" }
            },
            styles
        );
        this.transformers = transformers;
        this.transformers.push(stylize(this.styles));
        this.transformers.push(emojize());
    }

    log(data) {
        return this.output(data, true);
    }

    writeln(data) {
        return this.output(data, true);
    }

    table(rows, columns = {}) {
        return table(rows, {
            border: getBorderCharacters(this.tableTheme),
            columns
        });
    }

    applyTransformers(str) {
        this.transformers.forEach(transformer => {
            str = transformer(str);
        });
        return str;
    }

    progressBar(options = {}, theme = false) {
        return new progress.Bar(options, theme ? theme : progress.Presets.shades_classic);
    }

    output(data, newLine = false) {
        if (this.silent) {
            return;
        }

        data = deepMapValues(data, o => (_.isString(o) ? this.applyTransformers(o) : o));

        if (_.isString(data)) {
            process.stdout.write(data);
        } else {
            _.map(data, d => process.stdout.write(data));
        }

        if (newLine) {
            process.stdout.write("\n");
        }
    }
}
