const { Definitions: { Argument } } = require("components/di");
const { _service, _parameter, _services } = require("components/di").helpers;

test("Helper _service should create an Argument of type 'service'", () => {
    expect(_service("service")).toBeInstanceOf(Argument);
});

test("Helper _parameter should create an Argument of type 'parameter'", () => {
    expect(_parameter("val")).toBeInstanceOf(Argument);
});

test("Helper _services should create an Argument of type 'services'", () => {
    expect(_services()).toBeInstanceOf(Argument);
});
