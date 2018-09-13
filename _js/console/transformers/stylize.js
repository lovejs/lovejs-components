const _ = require("lodash");
const chalk = require("chalk");

const hexTagReg = /^#(?:[0-9a-fA-F]{3}){1,2}$/;
const styleTagsReg = /\[([\w]+)[^\]]*\](.*?)\[\/\1\]/g;

const getChalkMethods = (value, type) => {
    let methods = [];
    if (type === "style") {
        if (!_.isArray(value)) {
            value = [value];
        }
        _.map(_.isArray(value) ? value : [value], style => methods.push({ method: style }));
    } else {
        let args;

        if (_.isArray(value) && value.length == 3) {
            method = "rgb";
            args = value;
        } else if (_.isString(value)) {
            if (chalk[value]) {
                method = value;
            } else {
                method = hexTagReg.test(value) ? "hex" : "keyword";
                args = [value];
            }
        } else {
            throw new Error(`Invalid value for ${type} must be a color in one of this formats: #FFFFFF, [255,255,255] or a color name`);
        }

        methods.push({ method: type == "bg" ? _.camelCase(`bg_${method}`) : method, args });
    }

    return methods;
};

const getStyles = definitions => {
    if (!_.isPlainObject(definitions)) {
        throw new Error(`Command styles must be an object with styles names as keys`);
    }

    let styles = {};

    for (style in definitions) {
        let methods = [];
        let definition = definitions[style];

        if (!_.isPlainObject(definition)) {
            definition = { fg: definition };
        }

        let instance = null;
        _.each(["fg", "bg", "style"], type => {
            if (definition[type]) {
                methods = methods.concat(getChalkMethods(definition[type], type));
            }
        });

        styles[style.toLowerCase()] = { methods, transform: definition.transform };
    }

    return styles;
};

const applyStyles = (str, availableStyles) => {
    const stylize = (str, currentMethods = []) => {
        return str.replace(styleTagsReg, (match, $1, $2) => {
            const tagStyle = availableStyles[$1.toLowerCase()] || false;
            if (!tagStyle) {
                return match;
            }

            const methods = currentMethods.concat(tagStyle.methods);
            let i = chalk;
            for ({ method, args } of methods) {
                if (i[method]) {
                    i = args ? i[method].apply(i, args) : i[method];
                }
            }

            return stylize(i(tagStyle.transform ? tagStyle.transform($2) : $2), methods);
        });
    };

    return stylize(str, []);
};

module.exports = styles => {
    return str => applyStyles(str, getStyles(styles));
};
