import { Argument } from "./Definitions";

export const _service = (v, o = {}) => new Argument("service", v, o);

export const _parameter = (v, o = {}) => new Argument("parameter", v, o);

export const _services = (v?, o = {}) => new Argument("services", v, o);

export const _default = (v, o = {}) => new Argument("default", v, o);
