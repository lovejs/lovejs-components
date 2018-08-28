import { Tag } from "../index";

const tag = new Tag("name", "data");

test("Create instance of Tag", () => {
    expect(tag).toBeInstanceOf(Tag);
    expect(tag.getName()).toBe("name");
    expect(tag.getData()).toBe("data");
    expect(tag.toString()).toBe("name");
});
