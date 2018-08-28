export interface ModulesResolver {
    resolve(...args): Promise<any>;
}
