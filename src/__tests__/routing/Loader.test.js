const Loader = require("components/routing").Loader;

const instance = new Loader();

test("Create instance of an Loader", () => {
    expect(instance).toBeInstanceOf(Loader);
});
