import { ParametersMap, ServicesMap } from "./Container";

export interface DefinitionsLoaderInterface {
    load(...args): Promise<{ parameters: ParametersMap; services: ServicesMap }>;
}
