const { Definitions: { Argument, Arguments } } = require("components/di");

test("Create instance of an Arguments", () => {
    expect(new Arguments()).toBeInstanceOf(Arguments);
});
