const _ = require("lodash");
const fs = require("fs");
const path = require("path");
const globby = require("globby");
const FileReference = require("./FileReference");

const modulePathSeparator = "::";

class PathFinder {
    constructor() {
        this.paths = eval(`require.resolve.paths(__filename)`);
    }

    get(internalPath, context = {}) {
        if (internalPath instanceof FileReference) {
            return internalPath;
        }

        if (!_.isString(internalPath)) {
            throw new Error(`PathFinder await a string parameter when calling get`);
        }

        const { modulePath, objectPath } = this.getParts(internalPath);
        const filepath = this.getPathFile(modulePath, context);
        const reference = new FileReference(filepath, objectPath);

        if (objectPath && reference.getDefaultContent() == undefined) {
            throw new Error(`PathFinder find the module "${modulePath}" but was not able to access content at path "${objectPath}" `);
        }

        return reference;
    }

    mget(glob, context = {}) {
        const opts = { absolute: true };
        this.validateContext(context);

        if (context.cwd) {
            if (this.getPathType(context.cwd) !== "directory") {
                throw new Error(
                    `PathFinder error while getting files from pattern ${glob} the supplied context "cwd" directory ${
                        context.cwd
                    } doesn't exists`
                );
            }
            opts.cwd = context.cwd;
        }

        return globby.sync(glob, opts).map(f => new FileReference(f));
    }

    getPathType(filepath) {
        try {
            const stats = fs.statSync(filepath);
            if (!stats) {
                return false;
            }
            if (stats.isDirectory()) {
                return "directory";
            } else if (stats.isFile()) {
                return "file";
            }
            return false;
        } catch (e) {
            return false;
        }
    }

    resolvePath(filepath, context) {
        if (path.isAbsolute(filepath)) {
            return filepath;
        }

        if (!context.cwd) {
            throw new Error(`PathFinder is unable to resolve relative path ${filepath} as there is not cwd provided in context`);
        }

        return path.resolve(context.cwd, filepath);
    }

    getPathFile(pathfile, context = {}) {
        this.validateContext(context);
        let paths = this.paths.slice(0);
        const isAbsolute = path.isAbsolute(pathfile);

        if (!isAbsolute && context && context.cwd) {
            paths.unshift(context.cwd);
        }

        try {
            return eval(`require.resolve(pathfile, { paths })`);
        } catch (e) {
            if (isAbsolute) {
                throw new Error(`PathFinder was unable to find module file for "${pathfile}"`);
            } else {
                const dirs = paths.join("\n");
                throw new Error(`PathFinder was unable to find module file for "${pathfile}" in directories: \n ${dirs}`);
            }
        }
    }

    getParts(internalPath) {
        const pathIndex = internalPath.indexOf(modulePathSeparator);
        const hasPath = pathIndex !== -1;

        return {
            modulePath: hasPath ? internalPath.slice(0, pathIndex) : internalPath,
            objectPath: hasPath ? internalPath.slice(pathIndex + modulePathSeparator.length) : false
        };
    }

    getInternalPath(modulePath, objectPath = false) {
        return objectPath ? `${modulePath}::${objectPath}` : modulePath;
    }

    validateContext(context) {
        if (!_.isPlainObject(context)) {
            throw new Error(`Context must be a plain object : ${context} given`);
        }
        if (context.cwd && !_.isString(context.cwd)) {
            throw new Error(`Context "cwd" option must be a string`);
        }
    }
}

module.exports = PathFinder;
