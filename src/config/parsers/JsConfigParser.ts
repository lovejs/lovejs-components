import { ConfigParser } from "../index";

export class JsConfigParser extends ConfigParser {
    /**
     * @inheritdoc
     */
    supports(extension) {
        return extension.toLowerCase() == ".js";
    }

    /**
     * @inheritdoc
     */
    parse(content: any): any {
        return content;
    }
}
