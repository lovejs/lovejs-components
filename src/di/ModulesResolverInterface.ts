export interface ModulesResolverInterface {
    resolve(internalPath: string, parentPath?: string): Promise<any>;
}
