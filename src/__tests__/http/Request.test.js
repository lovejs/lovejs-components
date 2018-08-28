const Request = require("components/http").Request;

const instance = new Request();

test("Create instance of an Request", () => {
    expect(instance).toBeInstanceOf(Request);
});
