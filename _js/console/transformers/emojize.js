const emoji = require("node-emoji");

module.exports = (onMissing = undefined) => {
    return str => emoji.emojify(str, onMissing);
};
