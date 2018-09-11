import { LocalModulesResolver } from "../..";

describe("#DI [Local Modules resolver]", function() {
    const resolver = new LocalModulesResolver();
    it("Should resolve absolute path", async () => {
        const res = await resolver.resolve(__dirname + "/data/module");
        expect(res).toBe("module");
    });

    it("Should resolve relative path", async () => {
        const res = await resolver.resolve("data/module", __dirname);
        expect(res).toBe("module");
    });

    it("Should resolve installed modules", async () => {
        const res = await resolver.resolve("lodash");
        expect(res.VERSION).toBeDefined();
    });

    it("Should resolve target path", async () => {
        const res1 = await resolver.resolve("lodash::VERSION");
        const res2 = await resolver.resolve("lodash");
        expect(res1).toBeDefined();
        expect(res2).toBeDefined();
        expect(res1).toBe(res2.VERSION);
    });

    it("Should failed with unknown module", async () => {
        const check = async () => await resolver.resolve("unknow-target-module");
        await expect(check()).rejects.toThrow(Error);
    });

    it("Should failed with known module but unknown target path", async () => {
        const check = async () => await resolver.resolve("lodash::UNKNOW");
        await expect(check()).rejects.toThrow(Error);
    });
});
