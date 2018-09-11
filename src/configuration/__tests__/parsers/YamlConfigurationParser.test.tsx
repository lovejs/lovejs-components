import { ConfigurationToken, YamlConfigurationParser } from "../..";

describe("#Config [Parser YAML]", function() {
    it("shoud support .yml & .yaml file", () => {
        const parser = new YamlConfigurationParser();
        expect(parser.supports(".yaml")).toBeTruthy();
        expect(parser.supports(".yml")).toBeTruthy();
        expect(parser.supports(".YamL")).toBeTruthy();
    });

    it("should parse Yaml with special tags", async () => {
        const yaml = `
        fields:
            prop_a1:  !tag1 test
            prop_a2:  !tag1 { _: test }
            prop_b1:  !tag1 [a, b, c]
            prop_b2:  !tag1 { _: [a, b, c]}
            prop_c1:  !tag1 { p1: a, p2: b}
            prop_c2:  !tag1 { _: { p1: a, p2: b} }
            prop2:    !tag2 {p1: v1}
            prop3:    !tag3 [a, b, c]
        `;

        const parser = new YamlConfigurationParser();
        const res = await parser.parse(new Buffer(yaml), ["tag1", "tag2", "tag3"]);

        ["prop_a1", "prop_a2"].forEach(prop => {
            expect(res.fields[prop]).toBeInstanceOf(ConfigurationToken);
            expect(res.fields[prop].getTag()).toBe("tag1");
            expect(res.fields[prop].getData()).toBe("test");
        });

        ["prop_b1", "prop_b2"].forEach(prop => {
            expect(res.fields[prop]).toBeInstanceOf(ConfigurationToken);
            expect(res.fields[prop].getTag()).toBe("tag1");
            expect(res.fields[prop].getData()).toEqual(expect.arrayContaining(["a", "b", "c"]));
        });

        ["prop_c1", "prop_c2"].forEach(prop => {
            expect(res.fields[prop]).toBeInstanceOf(ConfigurationToken);
            expect(res.fields[prop].getTag()).toBe("tag1");
            expect(res.fields[prop].getData()).toMatchObject({ p1: "a", p2: "b" });
        });

        expect(res.fields.prop2).toBeInstanceOf(ConfigurationToken);
        expect(res.fields.prop2.getTag()).toBe("tag2");
        expect(res.fields.prop2.getData()).toMatchObject({ p1: "v1" });

        expect(res.fields.prop3).toBeInstanceOf(ConfigurationToken);
        expect(res.fields.prop3.getTag()).toBe("tag3");
        expect(res.fields.prop3.getData()).toEqual(expect.arrayContaining(["a", "b", "c"]));
    });

    it("should parse nested tags", async () => {
        const yaml = `
        fields:
            p1: !tag1 { _: !tag2 data }
            p2: !tag1 { p2a: data, p2b: !tag2 {a: b}}
        `;

        const parser = new YamlConfigurationParser();
        const res = await parser.parse(new Buffer(yaml), ["tag1", "tag2"]);

        expect(res.fields.p1).toBeInstanceOf(ConfigurationToken);
        expect(res.fields.p1.getData()).toBeInstanceOf(ConfigurationToken);
        expect(res.fields.p1.getData().getData()).toBe("data");

        expect(res.fields.p2).toBeInstanceOf(ConfigurationToken);
        expect(res.fields.p2.getData().p2a).toBe("data");
        expect(res.fields.p2.getData().p2b).toBeInstanceOf(ConfigurationToken);
        expect(res.fields.p2.getData().p2b.getData()).toMatchObject({ a: "b" });
    });
});
