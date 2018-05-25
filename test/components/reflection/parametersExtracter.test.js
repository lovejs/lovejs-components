const { parametersExtracter } = require("components/reflection");

test("Extracter should extract args from function, arrow functions and class", () => {
    function myFunction(p1, p2, p3) {}
    const arrowFunction = (p1, p2, p3) => true;
    class aClass {
        constructor(p1, p2, p3) {}
    }

    expect(parametersExtracter(myFunction)).toEqual(expect.arrayContaining(["p1", "p2", "p3"]));
    expect(parametersExtracter(arrowFunction)).toEqual(expect.arrayContaining(["p1", "p2", "p3"]));
    expect(parametersExtracter(aClass)).toEqual(expect.arrayContaining(["p1", "p2", "p3"]));
});

const expectingParams = (fn, ar, debug) => {
    const extracted = parametersExtracter(fn);
    if (debug) {
        console.log(require("util").inspect(extracted, { depth: null }));
    }
    expect(extracted).toEqual(expect.arrayContaining(ar));
};

// p1
test("Extracter should extract simple literals", () => {
    function fn(p1) {}
    expectingParams(fn, ["p1"]);
});

// p1 = "param1"
test("Extracter should extract from default", () => {
    function fn(p1 = "param1") {}
    expectingParams(fn, ["param1"]);
});

// {p1}
test("Extracter should extract from object property shortcut", () => {
    function fn({ p1 }) {}
    expectingParams(fn, [{ p1: true }]);
});

// {p1: alias}
test("Extracter should extract from object property without shortcut", () => {
    function fn({ "test:param1": p1 }) {}
    expectingParams(fn, [{ "test:param1": true }]);
});

// {p1: alias = "default"}
test("Extracter should extract from object property without shortcut and with default", () => {
    function fn({ "test:param1": p1 = "param" }) {}
    expectingParams(fn, [{ "test:param1": true }]);
});

// [p1]
test("Extracter should extract from array", () => {
    function fn([p1]) {}
    expectingParams(fn, [["p1"]]);
});

// [p1 = "param1"]
test("Extracter should extract from array with default", () => {
    function fn([p1 = "param1"]) {}
    expectingParams(fn, [["param1"]]);
});

// [{p1}]
test("Extracter should extract from object in array", () => {
    function fn([{ p1 }]) {}
    expectingParams(fn, [[{ p1: true }]]);
});

// [{p1: "param1"}]
test("Extracter should extract from object in array", () => {
    function fn([{ param1: p1 }]) {}
    expectingParams(fn, [[{ param1: true }]]);
});

// Check not to deep
test("Extract should not go deeper thant 1-level in object", () => {
    function fn({ p1: { p2: { p3: foo } } }) {}
    expectingParams(fn, [{ p1: true }]);
});

// Exception if p1 = default when default is not a string
test("Extracter should raise an exception if default value is not a string", () => {
    function fn(p1 = 12) {}
    expect(() => parametersExtracter(fn)).toThrowError();
});

// Rest operator with object
test("Extracter should ignore rest operator with object", () => {
    function fn({ p1, p2, ...rest }) {}
    expectingParams(fn, [{ p1: true, p2: true }]);
});

// Rest operator with array
test("Extracter should ignore rest operator with array", () => {
    function fn([p1, p2, ...rest]) {}
    expectingParams(fn, [["p1", "p2"]]);
});

// Classes extends
test("Extracter should be able to follow inheritance of classes", () => {
    class class1 {
        constructor(s1, s2) {}
    }
    class class2 extends class1 {}
    expectingParams(class2, ["s1", "s2"]);
});
