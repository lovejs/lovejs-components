const Listener = require("./Listener");

const listener = (priority, callable, method) => new Listener(priority, callable, method);

export { listener };
