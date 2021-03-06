import * as _ from "lodash";
import * as path from "path";
import { ModulesResolverInterface } from "..";

export class LocalModulesResolver implements ModulesResolverInterface {
    async resolve(internalPath: string, parentPath?: string) {
        const [modulePath, targetPath] = internalPath.split("::");
        const isAbsolute = path.isAbsolute(modulePath);
        const paths = eval(`require.resolve.paths(__filename)`).slice(0);

        if (!isAbsolute && parentPath) {
            paths.unshift(parentPath);
        }

        let filePath;
        try {
            filePath = eval(`require.resolve(modulePath, { paths })`);
        } catch (e) {
            let directories = isAbsolute ? "" : `in directories: \n ${paths.join("\n")}`;
            throw new Error(`Local Module Resolver was unable to find module file for "${modulePath}" ${directories}`);
        }

        const module = require(filePath);
        if (targetPath) {
            if (!_.has(module, targetPath)) {
                throw new Error(`Module found but nothing found at target path ${targetPath}`);
            }
            return _.get(module, targetPath);
        } else {
            return module;
        }
    }
}
