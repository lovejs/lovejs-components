const Settings = require("components/settings").Settings;

const instance = new Settings();

test("Create instance of an Settings", () => {
    expect(instance).toBeInstanceOf(Settings);
});
