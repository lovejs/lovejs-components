const Router = require("components/routing").Router;

const instance = new Router();

test("Create instance of an Router", () => {
    expect(instance).toBeInstanceOf(Router);
});
