import * as _ from "lodash";
import { Validator } from "../../validation";
import { MatcherInterface } from "../MatcherInterface";
import { Route } from "../Route";

export abstract class BaseMatcher implements MatcherInterface {
    /**
     * @inheritdoc
     */
    abstract match(context, options, route: Route);

    /**
     * Return a schema to validate options
     * with the default Validator
     */
    getOptionsSchema(): object {
        return { type: "string" };
    }

    /**
     * @inheritdoc
     */
    validateOptions(options) {
        const validator = new Validator();
        return validator.validate(options, this.getOptionsSchema());
    }

    /**
     * @inheritdoc
     */
    mergeOptions(options, inheritOptions) {
        return options || inheritOptions;
    }
}
