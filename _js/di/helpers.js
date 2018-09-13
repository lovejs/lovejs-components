const Argument = require("./Definitions/Argument");

module.exports = {
    _service: (v, o = {}) => new Argument("service", v, o),
    _parameter: (v, o = {}) => new Argument("parameter", v, o),
    _services: (v, o = {}) => new Argument("services", v, o)
};
