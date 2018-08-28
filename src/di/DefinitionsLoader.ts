import { ParametersMap, ServicesMap } from "./Container";

export interface DefinitionsLoader {
    load(...args): Promise<{ parameters: ParametersMap; services: ServicesMap }>;
}
