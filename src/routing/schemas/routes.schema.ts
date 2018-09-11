export const RouteNamePattern = "^[a-zA-Z0-9_]+(?:[_]+[a-zA-Z0-9]+)*$";

export const RoutesSchema = {
    type: "object",
    patternProperties: {
        [RouteNamePattern]: {
            type: "object",
            properties: {
                ".type": { type: "string" },
                ".children": { type: "object" }
            }
        }
    },
    additionalProperties: false,
    errorMessage: {
        additionalProperties: "Invalid route name"
    }
};
