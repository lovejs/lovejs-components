const _ = require("lodash");
const Output = require("./Output");

class Command {
    constructor() {
        this.out = this.getOutput();
    }

    getOutput() {
        const config = {};
        if (this.getOutputStyles) {
            config.styles = this.getOutputStyles();
        }
        return new Output(config);
    }

    output() {
        return this.out.output(...arguments);
    }

    table() {
        return this.out.table(...arguments);
    }

    progressBar() {
        return this.out.progressBar(...arguments);
    }
}

module.exports = Command;
