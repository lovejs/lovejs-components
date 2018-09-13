const _ = require("lodash");

const classRegexp = /^class\s/;

function isFunction(func) {
    return typeof func === "function";
}

function isClass(func) {
    return typeof func === "function" && classRegexp.test(Function.prototype.toString.call(func));
}

function isClassInstance(func) {
    return func && typeof func === "object" && func.constructor && classRegexp.test(func.constructor.toString());
}

function deepMapValues(obj, callback, propertyPath) {
    propertyPath = propertyPath || "";

    if (_.isArray(obj)) {
        return _.map(obj, deepMapValuesIteratee);
    } else if (_.isPlainObject(obj)) {
        return _.mapValues(obj, deepMapValuesIteratee);
    } else {
        return callback(obj, propertyPath);
    }

    function deepMapValuesIteratee(value, key) {
        var valuePath = propertyPath ? propertyPath + "." + key : key;
        return deepMapValues(value, callback, valuePath);
    }
}

function resolveFunctionValuesWith(obj, self, ...args) {
    const mapValues = obj => {
        if (_.isFunction(obj)) {
            return obj.apply(self, args);
        } else if (_.isArray(obj)) {
            return _.map(obj, mapValues);
        } else if (_.isPlainObject(obj)) {
            return _.mapValues(obj, mapValues);
        } else {
            return obj;
        }
    };

    return mapValues(obj);
}

function getMatchingGroup(regexp, str, groupIndex = 0) {
    var matches = [];
    var match;
    while ((match = regexp.exec(str))) {
        matches.push(match[groupIndex]);
    }

    return matches;
}

module.exports = { isFunction, isClass, isClassInstance, resolveFunctionValuesWith, deepMapValues, getMatchingGroup };
