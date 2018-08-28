const Route = require("components/routing").Route;

const instance = new Route("route", {});

test("Create instance of a Route", () => {
    expect(instance).toBeInstanceOf(Route);
});
