const Matcher = require("components/routing").Matcher;

const instance = new Matcher();

test("Create instance of an Matcher", () => {
    expect(instance).toBeInstanceOf(Matcher);
});
