const _ = require("lodash");

class TemplateTag {
    constructor(template) {
        this.template = _.template(template);
    }

    resolve(variables) {
        return this.template(variables);
    }
}

module.exports = TemplateTag;
