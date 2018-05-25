const RouteNamePattern = "^[a-zA-Z0-9_]+(?:[_]+[a-zA-Z0-9]+)*$";

module.exports = {
    type: "object",
    patternProperties: {
        [RouteNamePattern]: { type: "object" }
    },
    additionalProperties: false,
    errorMessage: {
        additionalProperties: "Invalid route name"
    }
};
