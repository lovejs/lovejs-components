import * as _ from "lodash";
import { AutowireResolver, Argument } from "../../..";

const resolver = new AutowireResolver();

const resolvedFirst = async target => {
    const resolved = await resolver.resolve(target);
    return _.first(resolved);
};

const expectArgument = (arg, type, value) => {
    expect(arg).toBeInstanceOf(Argument);
    expect(arg.getType()).toBe(type);
    expect(arg.getValue()).toBe(value);
};

const expectService = async (target, service) => {
    expectArgument(await resolvedFirst(target), "service", service);
};

describe("#DI [Autowire Resolver]", function() {
    it("Should resolve as an array", async () => {
        const fun1 = (p1) /* p1 */ => true;
        const resolved = await resolver.resolve(fun1);
        expect(resolved).toBeInstanceOf(Array);
    });

    it('Resolve args function(p1) to _service("p1")', async () => {
        const fun1 = p1 => true;
        return expectService(fun1, "p1");
    });

    it('Resolve args function(p1) to _service("p1")', async () => {
        const fun1 = (p1 = "service1") => true;
        return expectService(fun1, "p1");
    });

    it('Resolve args function({p1}) to {p1: _service("p1")}', async () => {
        const fun1 = ({ p1 }) => true;
        const res = await resolvedFirst(fun1);
        return expectArgument(res.p1, "service", "p1");
    });

    it('Resolve args function({"myservice": p1}) to {myservice: _service("myservice")}', async () => {
        const fun1 = ({ s: p1 /* myservice */ }) => true;
        const res = await resolvedFirst(fun1);

        return expectArgument(res.s, "service", "myservice");
    });

    it("Resolve args function([p1, p2 = s2]) to [p1, s2]", async () => {
        const fun1 = ([p1, p2 = "s2" /* myservice */, p3]) => true;
        const res = await resolvedFirst(fun1);

        expectArgument(res[0], "service", "p1");
        expectArgument(res[1], "service", "myservice");
        expectArgument(res[2], "service", "p3");
    });
});
