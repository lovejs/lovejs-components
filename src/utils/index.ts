import * as _ from "lodash";
import * as Promise from "bluebird";

const classRegexp = /^class\s/;

export function isFunction(func) {
    return typeof func === "function";
}

export function isClass(func) {
    return typeof func === "function" && classRegexp.test(Function.prototype.toString.call(func));
}

export function isClassInstance(func) {
    return func && typeof func === "object" && func.constructor && classRegexp.test(func.constructor.toString());
}

export async function deepMapValuesAsync(obj: any, callback, propertyPath?) {
    propertyPath = propertyPath || "";

    if (_.isArray(obj)) {
        return await Promise.map(obj, deepMapValuesIteratee);
    } else if (_.isPlainObject(obj)) {
        return await Promise.props(_.mapValues(obj, deepMapValuesIteratee));
    } else {
        return await callback(obj, propertyPath);
    }

    async function deepMapValuesIteratee(value, key) {
        var valuePath = propertyPath ? propertyPath + "." + key : key;
        return await deepMapValuesAsync(value, callback, valuePath);
    }
}

export function deepMapValues(obj: object, callback, propertyPath?) {
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

export function resolveFunctionValuesWith(obj, self, ...args) {
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

export function getMatchingGroup(regexp, str, groupIndex = 0) {
    var matches = [];
    var match;
    while ((match = regexp.exec(str))) {
        matches.push(match[groupIndex]);
    }

    return matches;
}
