const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createAuthService } = require("../../src/modules/auth/auth.service");
const { UnauthorizedError } = require("../../src/errors/AppError");

const SECRET = "unit-test-secret";
const anna = { id: 2, username: "anna", role: "WAITER", passwordHash: bcrypt.hashSync("anna123", 4) };

const service = createAuthService({
    usersRepository: { findByUsername: async username => (username === "anna" ? anna : null) },
    jwtSecret: SECRET,
    jwtExpiresIn: "1h"
});

describe("auth.service", () => {
    test("returns a signed token with the user's id and role", async () => {
        const { token, user } = await service.login({ username: "anna", password: "anna123" });

        const payload = jwt.verify(token, SECRET);
        assert.equal(payload.sub, "2");
        assert.equal(payload.role, "WAITER");
        assert.equal(user.username, "anna");
    });

    test("gives the same error for a wrong password and an unknown user", async () => {
        const wrongPassword = await service.login({ username: "anna", password: "bad" }).catch(e => e);
        const unknownUser = await service.login({ username: "nobody", password: "bad" }).catch(e => e);

        assert.ok(wrongPassword instanceof UnauthorizedError);
        assert.ok(unknownUser instanceof UnauthorizedError);
        assert.equal(wrongPassword.message, unknownUser.message);
    });
});
