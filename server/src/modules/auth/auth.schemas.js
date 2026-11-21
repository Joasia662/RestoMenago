const { z } = require("zod");

const loginBody = z.strictObject({
    username: z.string().trim().min(1).max(50),
    password: z.string().min(1).max(100)
});

module.exports = { loginBody };