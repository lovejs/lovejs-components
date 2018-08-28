export * from "./Validator";
export * from "./ValidationError";

export interface ValidatorInterface {
    validate(data: any, schema: object): Promise<any>;
}
