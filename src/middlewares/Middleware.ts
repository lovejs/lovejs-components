import * as _ from "lodash";
import { Validator } from "../validation";

export abstract class Middleware {
    abstract getMiddleware();

    getOptionsSchema(): object {
        return {};
    }

    validateOptions(options) {
        const validator = new Validator();
        return validator.validate(options, this.getOptionsSchema());
    }

    normalizeOptions(options) {
        this.validateOptions(options);
        return options;
    }

    mergeOptions(options, inheritOptions) {
        return options || inheritOptions;
    }
}
