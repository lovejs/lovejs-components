const _ = require("lodash");
const Argument = require("./Argument");
const DiServiceError = require("../errors/DiServiceError");

class Arguments {
    constructor(args = []) {
        this.setArgs(args);
    }

    isPatch() {
        return _.isObject(this.args);
    }

    get(index) {
        return this.args[index] || false;
    }

    count() {
        return this.args ? this.args.length : 0;
    }

    getArgs() {
        return this.args;
    }

    setArgs(args) {
        if (!(_.isArray(args) || _.isObject(args))) {
            throw new DiServiceError("Args supplied to a service must be array or object");
        }

        this.args = args;

        return this;
    }

    replaceArg(index, arg) {
        if (_.has(this.args, index)) {
            this.args[index] = arg;
        }
    }
}

module.exports = Arguments;
