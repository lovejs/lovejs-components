const { Definitions: { Argument } } = require("components/di");

const arg = new Argument("type", "value");

test("Create instance of an Argument", () => {
    expect(arg).toBeInstanceOf(Argument);

    expect(arg.getType()).toBe("type");
    expect(arg.getValue()).toBe("value");
});
