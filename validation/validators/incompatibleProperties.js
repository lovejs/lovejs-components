module.exports = {
    name: "incompatibleProperties",
    config: {
        type: "object",
        metaSchema: {
            type: "array",
            items: { type: "string" }
        },
        validate: (properties, data) => {
            let found = 0;
            for (let i = 0; i < properties.length; i++) {
                const property = properties[i];
                if (data[property] !== undefined) {
                    found++;
                    if (found > 1) {
                        return false;
                    }
                }
            }

            return true;
        }
    }
};
