import * as _ from "lodash";
import { Arguments } from "../Definitions";
import { _service, _parameter, _default } from "../helpers";
import { parametersExtracter, ExtractedParameter } from "../../reflection";
import { deepMapValues } from "../../utils";

/**
 * Resolve service autowired by resolving Arguments type
 */
export class AutowireResolver {
    protected parametersExtracter: (target: string, method?: string) => any[];

    constructor(_parametersExtracter = parametersExtracter) {
        this.parametersExtracter = _parametersExtracter;
    }

    /**
     * Resolve Arguments for given service module
     * @param target The target object
     * @param method
     */
    async resolve(target: any, method?: string) {
        const argsNames = this.parametersExtracter(target, method);
        return new Arguments(_.map(argsNames, a => this.resolveArgument(a)));
    }

    /**
     * Resolve an argument
     * @param arg
     */
    resolveArgument(arg: any) {
        return deepMapValues(arg, value => {
            if (value instanceof ExtractedParameter) {
                return this.resolveExtractedParameter(value);
            } else if (_.isArray(value)) {
                return _.map(arg, a => this.resolveArgument(a));
            } else if (_.isObject(arg)) {
                return _.mapValues(arg, (v, k) => this.resolveArgument(v));
            }
            return value;
        });
    }

    /**
     * Resolve an Extracted parameter,
     * turning a comment into a service or parameter argument
     * @param parameter The extracted parameter to convert
     */
    resolveExtractedParameter(parameter: ExtractedParameter) {
        let comments = parameter.getComments();
        if (comments) {
            comments = comments.trim();
            return _service(comments);
        }

        return _service(parameter.getName());
    }
}
