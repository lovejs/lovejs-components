import * as fs from "fs";
import * as path from "path";
import * as _ from "lodash";

const requirableExtensions = [".js", ".json"];

/**
 * Reference to a file
 */
export class FileReference {
    protected loaded: boolean;
    protected filepath: string;
    protected defaultPath?: string;
    protected content: any;

    constructor(filepath: string, defaultPath?: string) {
        if (!_.isString(filepath) || !path.isAbsolute(filepath)) {
            throw new Error(`FileReference first argument must be an absolute path "${filepath}" given`);
        }
        this.filepath = filepath;
        this.defaultPath = defaultPath;
        this.loaded = false;
        this.content = undefined;
    }

    /**
     * Is the file requirable (ie. able to call "require")
     */
    isRequireable(): boolean {
        return requirableExtensions.includes(this.getExtension());
    }

    /**
     * Get the default path
     */
    getDefaultPath() {
        return this.defaultPath;
    }

    /**
     * Get the file path optionnaly relative
     * @param relPath The relative path to apply
     */
    getFilePath(relPath?: string) {
        return relPath ? path.relative(relPath, this.filepath) : this.filepath;
    }

    /**
     * Get the content of file, optionnaly at given object path
     * @param objectPath
     */
    getContent(objectPath?: string) {
        if (!this.loaded) {
            this.content = this.isRequireable() ? require(this.filepath) : fs.readFileSync(this.filepath);

            if (_.isPlainObject(this.content) && this.content.default) {
                this.content = this.content.default;
            }
            this.loaded = true;
        }

        return objectPath ? _.get(this.content, objectPath) : this.content;
    }

    /**
     * Get the default content
     * @param async
     */
    getDefaultContent() {
        return this.getContent(this.defaultPath);
    }

    /**
     * Get the file extension
     */
    getExtension() {
        return path.extname(this.filepath);
    }

    /**
     * Get the file name
     * @param stripExtension Remove extension
     */
    getFileName(stripExtension: boolean = false) {
        return path.basename(this.filepath, stripExtension ? this.getExtension() : "");
    }

    /**
     * Get the file directory
     */
    getDirectory() {
        return path.dirname(this.filepath);
    }
}
