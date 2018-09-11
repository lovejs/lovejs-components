export const importsSchema: object = {
    type: "array",
    items: {
        oneOf: [
            { type: "string" },
            {
                type: "object",
                required: ["path"],
                properties: {
                    path: { type: "string" },
                    query: {},
                    merge: { enum: ["root", "filename"] }
                }
            }
        ]
    }
};
