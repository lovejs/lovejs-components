import { parametersExtracter, ExtractedParameter } from "..";

const p = (a, b = false, c?) => new ExtractedParameter(a, b, c);

function mafonction(name, param1) {
    /**
     * @param name Flut
     * @param param1 Flat
     */
    console.log(name);
    console.log(param1);
}

const expectingParams = (fn, ar, debug?) => {
    const extracted = parametersExtracter(fn);
    if (debug) {
        console.log(require("util").inspect(extracted, { depth: null }));
    }
    expect(extracted).toEqual(expect.arrayContaining(ar));
};

describe("#Reflection [Parameters extracter] ", function() {
    it("Extracter should extract args from function, arrow functions and class", () => {
        function myFunction(p1 /* p1 */, p2 /* p2 */, p3 /* p3 */) {}
        const arrowFunction = (p1 /* p1 */, p2 /* p2 */, p3 /* p3 */) => true;
        class aClass {
            constructor(p1 /* p1 */, p2 /* p2 */, p3 /* p3 */) {}
        }
        const resolving = ["p1", "p2", "p3"].map(a => p(a, false, a));
        expect(parametersExtracter(myFunction)).toEqual(expect.arrayContaining(resolving));
        expect(parametersExtracter(arrowFunction)).toEqual(expect.arrayContaining(resolving));
        expect(parametersExtracter(aClass)).toEqual(expect.arrayContaining(resolving));
    });

    // p1 => should resolve p1
    it("Extracter should extract simple comment", () => {
        function fn(p1, p2 /* comment */) {}
        expectingParams(fn, [p("p1"), p("p2", false, "comment")]);
    });

    // p1 = "param1" /* comment */ => should resolve param1
    it("Extracter should extract from default", () => {
        function fn(p1 = "param1" /* comment */) {}
        expectingParams(fn, [p("p1", true, "comment")]);
    });

    // {p1} => should resolve p1
    it("Extracter should not extract from destructuring property without default value", () => {
        function fn({ p1 }, { p2: a }) {}
        expectingParams(fn, [{ p1: p("p1") }, { p2: p("p2") }]);
    });

    // {p1 = "default", p2: alias = "default"}
    it("Extracter should extract from object property with default", () => {
        function fn({ p1 = "default", "test:param1": p2 = "default2" }) {}
        expectingParams(fn, [{ p1: p("p1", true), "test:param1": p("test:param1", true) }]);
    });

    // [p1]
    it("Extracter should extract from array", () => {
        function fn([p1 /* comment */]) {}
        expectingParams(fn, [[p("p1", false, "comment")]]);
    });

    // [p1 = "param1"]
    it("Extracter should extract from array with default", () => {
        function fn([p1 = "param1" /* comment */]) {}
        expectingParams(fn, [[p("p1", true, "comment")]]);
    });

    // [{p1}]
    it("Extracter should extract from object in array", () => {
        function fn([{ p1 /* comment */ }]) {}
        expectingParams(fn, [[{ p1: p("p1", false, "comment") }]]);
    });

    // [{p1: "param1"}]
    it("Extracter should extract from object in array", () => {
        function fn([{ param1: p1 /* comment */ }]) {}
        expectingParams(fn, [[{ param1: p("param1", false, "comment") }]]);
    });

    // [{p1: "param1" = "default"}]
    it("Extracter should extract from object in array", () => {
        function fn([{ param1: p1 = "default" /* comment */ }]) {}
        expectingParams(fn, [[{ param1: p("param1", true, "comment") }]]);
    });

    // Check not to deep
    it("Extract should not go deeper thant 1-level in object", () => {
        function fn({
            p1: {
                p2: { p3: foo } /* comment */
            }
        }) {}
        expectingParams(fn, [{ p1: p("p1") }]);
    });

    // Rest operator with object
    it("Extracter should ignore rest operator with object", () => {
        function fn({ p1, p2, ...rest }) {}
        expectingParams(fn, [{ p1: p("p1"), p2: p("p2") }]);
    });

    // Rest operator with array
    it("Extracter should ignore rest operator with array", () => {
        function fn([p1, p2, ...rest]) {}
        expectingParams(fn, [[p("p1"), p("p2")]]);
    });

    // Classes extends
    it("Extracter should be able to follow inheritance of classes", () => {
        class class1 {
            constructor(s1 /* parent */, s2) {}
        }
        class class2 extends class1 {}
        expectingParams(class2, [p("s1", false, "parent"), p("s2")]);
    });
});
