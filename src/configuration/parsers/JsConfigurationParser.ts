import { BaseConfigurationParser } from "../index";
import * as _eval from "eval";

export class JsConfigurationParser extends BaseConfigurationParser {
    /**
     * @inheritdoc
     */
    supports(extension) {
        return extension.toLowerCase() == ".js";
    }

    /**
     * @inheritdoc
     */
    async parse(content: any): Promise<any> {
        return _eval(content);
    }
}
