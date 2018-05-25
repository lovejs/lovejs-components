const { ModuleResolver, errors } = require("components/resolver");
const resolverError = errors.ModuleResolverError;

const validModule = __dirname + "/../../integration/module";
const validPath = "test.field";
const validPathValue = "value1";

const invalidModule = "invalid";
const invalidPath = "invalid_path";

const moduleResolver = new ModuleResolver();

test("Resolver should resolve a module without path", () => {
    expect(typeof moduleResolver.resolve(validModule)).toBe("object");
});

test("Resolver should resolve a module with path", () => {
    expect(moduleResolver.resolve(validModule + "::" + validPath)).toBe(validPathValue);
});

test("Resolver should throw a ModuleResolverError error if require module fail", () => {
    expect(() => moduleResolver.resolve(invalidModule)).toThrowError(resolverError);
});

test("Resolver should throw a ModuleResolverError error if path doesn't exist", () => {
    expect(() => moduleResolver.resolve(validModule + "::" + invalidPath)).toThrowError(resolverError);
});
