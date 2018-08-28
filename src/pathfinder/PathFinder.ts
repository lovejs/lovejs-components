import * as _ from "lodash";
import * as fs from "fs";
import * as path from "path";
import * as globby from "globby";

import { PathFinderInterface, PathType, FileReference } from "./index";

export const PathFinderModuleSeparator = "::";

/**
 * The path finder helps to resolve module and filepath
 *
 */
export class PathFinder implements PathFinderInterface {
    protected paths: string[];

    constructor() {
        this.paths = eval(`require.resolve.paths(__filename)`);
    }

    /**
     * Get a file reference given the internal path and optionnal context
     * @param internalPath The internal path under
     * @param currentDirectory Optionnaly, the current directory
     */
    get(internalPath: FileReference | string, currentDirectory?: string): FileReference {
        if (internalPath instanceof FileReference) {
            return internalPath;
        }

        const { modulePath, objectPath } = this.getParts(internalPath);
        const filepath = this.getPathFile(modulePath, currentDirectory);
        const reference = new FileReference(filepath, objectPath);

        if (objectPath && reference.getDefaultContent() == undefined) {
            throw new Error(`PathFinder find the module "${modulePath}" but was not able to access content at path "${objectPath}" `);
        }

        return reference;
    }

    mget(glob: string, currentDirectory?: string): FileReference[] {
        const opts = { absolute: true, cwd: currentDirectory };

        if (opts.cwd) {
            if (this.getPathType(opts.cwd) !== PathType.directory) {
                throw new Error(
                    `PathFinder error while getting files from pattern ${glob} the supplied context "cwd" directory ${
                        opts.cwd
                    } doesn't exists`
                );
            }
        }

        return globby.sync(glob, opts).map(f => new FileReference(f));
    }

    /**
     * Get the type of given path
     * @param filepath
     */
    getPathType(filepath): PathType | false {
        try {
            const stats = fs.statSync(filepath);
            if (!stats) {
                return false;
            }
            if (stats.isDirectory()) {
                return PathType.directory;
            } else if (stats.isFile()) {
                return PathType.file;
            }
            return false;
        } catch (e) {
            return false;
        }
    }

    /**
     * Resolve given path based on context
     */
    resolvePath(filepath, currentDirectory?: string) {
        if (path.isAbsolute(filepath)) {
            return filepath;
        }

        if (!currentDirectory) {
            throw new Error(`PathFinder is unable to resolve relative path ${filepath} as there is no current directory provided`);
        }

        return path.resolve(currentDirectory, filepath);
    }

    getPathFile(pathfile: string, currentDirectory?: string) {
        let paths = this.paths.slice(0);
        const isAbsolute = path.isAbsolute(pathfile);

        if (!isAbsolute && currentDirectory) {
            paths.unshift(currentDirectory);
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

    /**
     * Given an internal Path, return the module part and the object part
     * @param internalPath
     */
    getParts(internalPath: string) {
        const pathIndex = internalPath.indexOf(PathFinderModuleSeparator);
        const hasPath = pathIndex !== -1;

        return {
            modulePath: hasPath ? internalPath.slice(0, pathIndex) : internalPath,
            objectPath: hasPath ? internalPath.slice(pathIndex + PathFinderModuleSeparator.length) : undefined
        };
    }

    /**
     * Generate an internal path base on given module path and object path
     * @param modulePath
     * @param objectPath
     */
    getInternalPath(modulePath: string, objectPath?: string) {
        return objectPath ? `${modulePath}::${objectPath}` : modulePath;
    }
}
