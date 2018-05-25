const Arguments = require("./Arguments");

class Call {
    constructor(method, args = []) {
        this.method = method;
        this.args = new Arguments(args);
    }

    getMethod() {
        return this.method;
    }

    getArgs() {
        return this.args;
    }

    toString() {
        return this.method;
    }
}

module.exports = Call;
