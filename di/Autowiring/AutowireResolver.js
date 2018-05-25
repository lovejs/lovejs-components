const _ = require("lodash");

const Arguments = require("../Definitions/Arguments");
const { _service, _parameter } = require("../helpers");

class AutowireResolver {
    constructor(parametersExtracter) {
        this.parametersExtracter = parametersExtracter;
    }

    resolve(target, method, targetArgs) {
        const argsNames = this.parametersExtracter(target, method);
        const argsResolved = _.map(argsNames, this.resolveArgument.bind(this));
        const args = new Arguments(argsResolved);
        
        return args;
    }

    resolveArgument(arg) {
        if (_.isString(arg)) {
            return _service(arg);
        } else if (_.isArray(arg)) {
            return _.map(arg, this.resolveArgument);
        } else if (_.isObject(arg)) {
            return _.mapValues(arg, (v, k) => this.resolveArgument(v));
        } else {
            return arg;
        }
    }
}

module.exports = AutowireResolver;
