const { ConfigTag, parsers: { YamlConfigParser } } = require("components/config");

test("Create instance of a YamlConfigParser", () => {
    expect(new YamlConfigParser()).toBeInstanceOf(YamlConfigParser);
});

test("Parse Yaml with special tags", () => {
    const yaml = `
    fields:
      prop1:  !tag1 test
      prop2:  !tag2 {p1: v1}
      prop3:  !tag3 [a, b, c]
    `;

    const parser = new YamlConfigParser(["tag1", "tag2", "tag3"]);
    const res = parser.parse(yaml);

    expect(res.fields.prop1).toBeInstanceOf(ConfigTag);
    expect(res.fields.prop1.getType()).toBe("tag1");
    expect(res.fields.prop1.getData()).toBe("test");

    expect(res.fields.prop2).toBeInstanceOf(ConfigTag);
    expect(res.fields.prop2.getType()).toBe("tag2");
    expect(res.fields.prop2.getData()).toMatchObject({ p1: "v1" });

    expect(res.fields.prop3).toBeInstanceOf(ConfigTag);
    expect(res.fields.prop3.getType()).toBe("tag3");
    expect(res.fields.prop3.getData()).toEqual(expect.arrayContaining(["a", "b", "c"]));
});
