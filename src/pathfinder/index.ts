export * from "./FileReference";
export * from "./PathFinder";

import { FileReference } from "././FileReference";

export enum PathType {
    directory,
    file
}

export interface PathFinderInterface {
    get(internalPath: string, currentDirectory?: string): FileReference;
    mget(glob: string, currentDirectory?: string): FileReference[];
    getInternalPath(modulePath: string, objectPath?: string): string;
    resolvePath(filepath, currentDirectory?: string): string;
    getPathType(filepath): PathType | false;
}
