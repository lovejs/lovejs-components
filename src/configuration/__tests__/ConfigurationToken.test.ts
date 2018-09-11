import { ConfigurationToken } from "..";

describe("#Config [Token]", function() {
    it("should return tag and tag data", async () => {
        const token = new ConfigurationToken("tag1", "data1");

        expect(token.getTag()).toBe("tag1");
        expect(token.getData()).toBe("data1");
        token.setData("data2");
        expect(token.getData()).toBe("data2");
    });
});
