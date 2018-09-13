const Arguments = require("./Arguments");

class Call {
    constructor(method, args = [], doAwait = true) {
        this.method = method;
        this.args = new Arguments(args);
        this.await = doAwait;
    }

    getMethod() {
        return this.method;
    }

    getArgs() {
        return this.args;
    }

    getAwait() {
        return this.await;
    }

    toString() {
        return this.method;
    }
}

module.exports = Call;
