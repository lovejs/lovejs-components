const Context = require("../context/Context");

const http = require("http");
const _ = require("lodash");

const Request = require("./Request");
const Response = require("./Response");

const Cookies = require("cookies");
const createError = require("http-errors");
const httpAssert = require("http-assert");

/*
http.ServerResponse.prototype._writeHead = http.ServerResponse.prototype.writeHead;
http.ServerResponse.prototype._end = http.ServerResponse.prototype.end;

http.ServerResponse.prototype.writeHead = function(...args) {
    console.log("This is the write head of the request with args ...", args);
    this.head_args = args;
};

http.ServerResponse.prototype.end = function(...args) {
    console.log("This is the end of the request with args ...", args);
    this.ended = true;
    this.end_args = args;
    this.emit("ended");
};

http.ServerResponse.prototype.doEnd = function() {
    console.log("Ending for real");
    this._writeHead(...this.head_args);
    return this._end(...this.end_args);
};
*/
class HttpContext extends Context {
    constructor(request, response, options) {
        super(options);
        this.req = request;
        this.res = response;
        this.request = new Request(request);
        this.response = new Response(response);

        this.request.context = this;
        this.response.context = this;

        this.cookies = new Cookies(request, response, { secure: request.secure });
    }

    getRequest() {
        return this.request;
    }

    getResponse() {
        return this.response;
    }

    assert() {
        return httpAssert(arguments);
    }

    throw(...args) {
        throw createError(...args);
    }
}

const delegations = {
    request: {
        props: {
            querystring: true,
            idempotent: true,
            socket: true,
            search: true,
            method: true,
            query: true,
            path: true,
            url: true,
            origin: false,
            href: false,
            subdomains: false,
            protocol: false,
            host: false,
            hostname: false,
            URL: false,
            header: false,
            headers: false,
            secure: false,
            stale: false,
            fresh: false,
            ips: false,
            ip: false
        },
        methods: ["acceptsLanguages", "acceptsEncodings", "acceptsCharsets", "accepts", "get", "is"]
    },
    response: {
        props: {
            status: true,
            message: true,
            body: true,
            length: true,
            type: true,
            lastModified: true,
            etag: true,
            headerSent: false,
            writable: false
        },
        methods: ["attachment", "redirect", "remove", "vary", "set", "append", "flushHeaders"]
    }
};

const delegateProperty = (object, target, prop, writable) => {
    const definition = {
        get: function() {
            return this[target][prop];
        }
    };
    if (writable) {
        definition.set = function(v) {
            return (this[target][prop] = v);
        };
    }
    Object.defineProperty(object, prop, definition);
};

const delegateMethod = (object, target, method) => {
    object[method] = function() {
        return this[target][method].apply(this[target], arguments);
    };
};

for (let target in delegations) {
    const { props, methods } = delegations[target];
    Object.keys(props).map(prop => delegateProperty(HttpContext.prototype, target, prop, props[prop]));
    methods.map(method => delegateMethod(HttpContext.prototype, target, method));
}

module.exports = HttpContext;
