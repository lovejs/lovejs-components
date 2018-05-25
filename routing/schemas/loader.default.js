const routesSchema = require("./routes");

module.exports = {
    type: "object",
    properties: {
        _type: { type: "string" },
        _path: { oneOf: [{ type: "string" }, { typeof: "function" }] },
        _methods: { oneOf: [{ type: "string" }, { type: "array" }, { typeof: "function" }] },
        _: { oneOf: [routesSchema, { type: "string" }] }
    }
};
