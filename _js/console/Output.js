const _ = require("lodash");
const { deepMapValues } = require("../utils");
const stylize = require("./transformers/stylize");
const emojize = require("./transformers/emojize");

const { table, getBorderCharacters } = require("table");
const progress = require("cli-progress");

class Output {
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

    progessBar(options = {}, theme = false) {
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

module.exports = Output;
