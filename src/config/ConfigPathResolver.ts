/**
 * ConfigPathResolver interface resolve configuration path when loading file or importing other files
 */
export interface ConfigPathResolver {
    /**
     * Return the content of given file
     * @param targetPath the target path
     * @param currentPath the current path
     */
    getContent(targetPath: string, parentPath?: string): Promise<Buffer>;

    /**
     * Resolve an import and return a array of filepath and filename
     */
    resolveImport(targetPath: string, query?: any, parentPath?: string): Promise<FileInfo[]>;
}

export interface FileInfo {
    // Filename of the file without folder
    fileName: string;

    // Filename of the file without folder and extension
    fileNameNoExt: string;

    // File path complexe
    filePath: string;

    // Relative path
    relPath: string;

    // Parent path
    parentPath: string;

    // File extension
    extension: string;
}
