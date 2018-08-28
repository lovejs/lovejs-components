const Response = require("components/http").Response;

const instance = new Response();

test("Create instance of an Response", () => {
    expect(instance).toBeInstanceOf(Response);
});
