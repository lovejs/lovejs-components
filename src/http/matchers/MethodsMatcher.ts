import { BaseMatcher } from "../../routing";

export class MethodsMatcher extends BaseMatcher {
    /**
     * @inheritdoc
     */
    match(context, methods) {
        return methods.includes(context.method);
    }

    /**
     * @inheritdoc
     */
    getOptionsSchema() {
        const methods = ["GET", "HEAD", "POST", "PUT"];
        return {
            oneOf: [{ enum: methods }, { type: "array", items: { enum: methods } }]
        };
    }
}
