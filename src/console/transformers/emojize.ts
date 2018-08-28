const emoji = require("node-emoji");

export const emojize = (onMissing = undefined) => {
    return (str: string) => emoji.emojify(str, onMissing);
};
