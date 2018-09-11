import { Event } from "..";

const instance = new Event("name", "data");

describe("#Event Dispatcher [Event]", function() {
    it("Create instance of an Event with a name and some data", () => {
        expect(instance).toBeInstanceOf(Event);

        expect(instance.getName()).toBe("name");
        expect(instance.getData()).toBe("data");

        instance.setData("data_new");
        expect(instance.getData()).toBe("data_new");
    });

    it("addReject, hasRejects, getRejects", () => {
        expect(instance.hasRejects()).toBe(false);
        instance.addReject("reject");
        expect(instance.hasRejects()).toBe(true);
        expect(instance.getRejects()).toEqual(expect.arrayContaining(["reject"]));
        instance.addReject("reject2");
        expect(instance.hasRejects()).toBe(true);
        expect(instance.getRejects()).toEqual(expect.arrayContaining(["reject", "reject2"]));
    });

    it("addResult, hasResults, getResults, getLastResult", () => {
        expect(instance.hasResults()).toBe(false);
        instance.addResult("result");
        expect(instance.hasResults()).toBe(true);
        expect(instance.getResults()).toEqual(expect.arrayContaining(["result"]));
        instance.addResult("result2");
        expect(instance.hasResults()).toBe(true);
        expect(instance.getResults()).toEqual(expect.arrayContaining(["result", "result2"]));
        expect(instance.getLastResult()).toBe("result2");
        instance.addResult("result3");
        expect(instance.getLastResult()).toBe("result3");
    });

    it("stop, isStopped", () => {
        expect(instance.isStopped()).toBe(false);
        instance.stop();
        expect(instance.isStopped()).toBe(true);
    });
});
