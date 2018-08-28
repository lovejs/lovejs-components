import * as mockFs from "mock-fs";
import { LocalPathResolver } from "../../..";

mockFs({
    "/dir1": {
        f1: "content_f1",
        f2: "content_f2",
        dir2: {
            "f3.ext": "content_f3"
        }
    },
    "/dir2/dir3": {
        dir4: {
            f1: "1",
            f2: "2",
            f3: "3"
        },
        dir5: {
            "a.js": "a",
            "b.yml": "b",
            c: "c",
            "d.c.txt": "d",
            "e.txt": "e"
        },
        dir6: {
            "a.txt": "a"
        }
    }
});

afterAll(() => {
    mockFs.restore();
});

describe("#Config [Resolver local path]", function() {
    const resolver = new LocalPathResolver();

    it("should return content of file with absolue path", async () => {
        const content = await resolver.getContent("/dir1/f1");
        expect(content.toString()).toBe("content_f1");
    });

    it("should return content of file with relative path and parent path", async () => {
        const content = await resolver.getContent("dir2/f3.ext", "/dir1/f2");
        expect(content.toString()).toBe("content_f3");
    });

    it("should resolve import of file with absolute or relative path", async () => {
        let filenames = await resolver.resolveImport("/dir1/dir2/f3.ext");
        expect(filenames[0]).toMatchObject({ fileName: "f3.ext", filePath: "/dir1/dir2/f3.ext" });

        filenames = await resolver.resolveImport("dir2/f3.ext", undefined, "/dir1/f1");
        expect(filenames[0]).toMatchObject({ fileName: "f3.ext", filePath: "/dir1/dir2/f3.ext" });
    });

    it("should resolve import of directory with absolute or relative path", async () => {
        let filenames = await resolver.resolveImport("/dir2/dir3/dir4");
        for (let idx of [1, 2, 3]) {
            expect(filenames[idx - 1]).toMatchObject({ fileName: `f${idx}`, filePath: `/dir2/dir3/dir4/f${idx}` });
        }

        filenames = await resolver.resolveImport("dir3/dir4", undefined, "/dir2");
        for (let idx of [1, 2, 3]) {
            expect(filenames[idx - 1]).toMatchObject({ fileName: `f${idx}`, filePath: `/dir2/dir3/dir4/f${idx}` });
        }
    });

    it("should resolve import with glob query", async () => {
        let filenames = await resolver.resolveImport("/dir2/dir3", "**/*.txt");
        expect(filenames[0]).toMatchObject({ fileName: "d.c.txt", filePath: "/dir2/dir3/dir5/d.c.txt" });
        expect(filenames[1]).toMatchObject({ fileName: "e.txt", filePath: "/dir2/dir3/dir5/e.txt" });
        expect(filenames[2]).toMatchObject({ fileName: "a.txt", filePath: "/dir2/dir3/dir6/a.txt" });
    });
});
