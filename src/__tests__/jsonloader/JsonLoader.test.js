import { JsonLoader } from "components/jsonloader";

const getReadMock = files => {
    return jest.fn().mockImplementation(f => {
        return files[f] ? files[f] : files[f.slice(1)];
    });
};

const getFilesMock = () => jest.fn().mockReturnValue(["/file1", "/file2", "/file3", "/complex/path/file4", "/path2/file5.js"]);

test("Create instance of an JsonLoader without json should raise an exception", () => {
    expect(() => new JsonLoader()).toThrowError();
});

test("Create instance of JsonLoader with a plain object", () => {
    const json = {
        f1: "v1"
    };
    const loader = new JsonLoader(json);
    return loader.parse().then(data => {
        expect(data).toMatchObject({ f1: "v1" });
    });
});

test("JsonLoader getImports should resolve imports", () => {
    const loader = new JsonLoader({});
    const json = {
        imports: [
            "test_import",
            { key: "test_key", file: "test_import2" },
            "test_import3",
            { file: "test_import4", key: "test_key2", order: "after" }
        ]
    };
    const expected = [
        { file: "test_import", order: "before" },
        { key: "test_key", file: "test_import2", order: "before" },
        { file: "test_import3", order: "before" },
        { file: "test_import4", order: "after", key: "test_key2" }
    ];

    expect(loader.getImports(json)).toEqual(expect.arrayContaining(expected));
});

test("JsonLoader import should respect order and remove imports declaration after parsing", () => {
    const file1 = {
        imports: [{ file: "/file2", order: "after" }, { file: "/file3", order: "before" }],
        field1: "value1_file1",
        field2: "value2_file1"
    };
    const file2 = { field1: "value1_file2" };
    const file3 = {
        field1: "value1_file3",
        field2: "value2_file3",
        field3: "value3_file3"
    };

    const loader = new JsonLoader("/file1");
    loader.read = getReadMock({ file1, file2, file3 });

    const expected = {
        field1: "value1_file2",
        field2: "value2_file1",
        field3: "value3_file3"
    };

    return loader.parse().then(data => {
        expect(data).toMatchObject(expected);
    });
});
