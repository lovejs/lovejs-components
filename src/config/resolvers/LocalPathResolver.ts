import { ConfigPathResolver, FileInfo } from "../index";
import * as fs from "fs";
import * as path from "path";
import * as globby from "globby";

import { promisify } from "util";

const readFile = promisify(fs.readFile);
const stat = promisify(fs.stat);

export class LocalPathResolver implements ConfigPathResolver {
    /**
     * Resolve a path based on target path and optionnal current path
     * @param targetPath The target path (absolute or relative)
     * @param parentPath The current path in case of a relative path
     */
    protected async resolvePath(targetPath: string, parentPath?: string) {
        if (path.isAbsolute(targetPath)) {
            return targetPath;
        }

        if (!parentPath) {
            throw new Error(`Missing current path when supplying relative path`);
        }

        const parentStat = await stat(parentPath);

        return path.resolve(parentStat.isFile() ? path.dirname(parentPath) : parentPath, targetPath);
    }

    /**
     * @inheritdoc
     */
    async resolveImport(targetPath: string, query?: string, parentPath?: string): Promise<FileInfo[]> {
        targetPath = await this.resolvePath(targetPath, parentPath);
        const pathStats = await stat(targetPath);
        let files: string[] = [];

        if (pathStats.isFile()) {
            files.push(targetPath);
        } else if (pathStats.isDirectory()) {
            files = await globby(query || "*", { absolute: true, cwd: targetPath });
        } else {
            throw new Error(`Invalid import`);
        }

        return files.map(filePath => ({
            filePath,
            fileName: path.basename(filePath),
            fileNameNoExt: path.basename(filePath, path.extname(filePath)),
            parentPath,
            relPath: parentPath ? path.relative(parentPath, filePath) : filePath,
            extension: path.extname(filePath)
        }));
    }

    /**
     * @inheritdoc
     */
    async getContent(targetPath: string, parentPath?: string) {
        return await readFile(await this.resolvePath(targetPath, parentPath));
    }
}
