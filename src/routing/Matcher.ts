import * as _ from "lodash";
import { Validator } from "../validation";

export class Matcher {
    match(context, options, route) {
        return true;
    }

    getOptionsSchema(): object {
        return { type: "string" };
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
