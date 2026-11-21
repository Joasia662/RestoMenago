// Integration tests: real HTTP requests (supertest) through the whole app
// to the real PostgreSQL from server/.env.
// WARNING: the database is reset with the seed before the tests run.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const config = require("../../src/config");
const db = require("../../src/db/knex");
const { createApp } = require("../../src/app");
const { createUnitOfWork } = require("../../src/db/unitOfWork");

let app;

async function login(username, password) {
    const res = await request(app).post("/api/auth/login").send({ username, password });
    return res.body.token;
}

before(async () => {
    await db.migrate.latest();
    await db.seed.run();
    const { repositories, runInTransaction } = createUnitOfWork(db);
    app = createApp({ db, repositories, runInTransaction, config });
});

after(() => db.destroy());

describe("REST API", () => {
    test("login returns a token, wrong password returns 401", async () => {
        const ok = await request(app).post("/api/auth/login").send({ username: "anna", password: "anna123" });
        assert.equal(ok.status, 200);
        assert.ok(ok.body.token);
        assert.deepEqual(ok.body.user, { id: 2, username: "anna", role: "WAITER" });

        const bad = await request(app).post("/api/auth/login").send({ username: "anna", password: "wrong" });
        assert.equal(bad.status, 401);
        assert.equal(bad.body.error.code, "UNAUTHORIZED");
    });

    test("access control: 401 without token, 403 for a waiter, 201 for the manager", async () => {
        const noToken = await request(app).get("/api/tables");
        assert.equal(noToken.status, 401);

        const waiterToken = await login("anna", "anna123");
        const waiter = await request(app)
            .post("/api/tables")
            .set("Authorization", `Bearer ${waiterToken}`)
            .send({ number: 20, seats: 4 });
        assert.equal(waiter.status, 403);

        const adminToken = await login("manager", "manager123");
        const admin = await request(app)
            .post("/api/tables")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ number: 20, seats: 4 });
        assert.equal(admin.status, 201);
        assert.match(admin.headers.location, /^\/api\/tables\/\d+$/);
    });

    test("validation returns 400 with all errors at once", async () => {
        const token = await login("manager", "manager123");
        const res = await request(app)
            .post("/api/tables")
            .set("Authorization", `Bearer ${token}`)
            .send({ number: "x", seats: 0, id: 5 });

        assert.equal(res.status, 400);
        assert.equal(res.body.error.code, "VALIDATION_ERROR");
        assert.equal(res.body.error.details.length, 3);
    });

    test("business rule: a table cannot have two active orders (409)", async () => {
        const token = await login("anna", "anna123");
        const res = await request(app)
            .post("/api/orders")
            .set("Authorization", `Bearer ${token}`)
            .send({ tableId: 3 }); // table 3 has an OPEN order in the seed

        assert.equal(res.status, 409);
        assert.equal(res.body.error.code, "TABLE_ALREADY_HAS_ACTIVE_ORDER");
    });

    test("full order flow: open, add item, kitchen, served, paid", async () => {
        const token = await login("anna", "anna123");
        const auth = { Authorization: `Bearer ${token}` };

        const created = await request(app).post("/api/orders").set(auth).send({
            tableId: 2,
            items: [{ menuItemId: 1, quantity: 2, note: "no onion" }]
        });
        assert.equal(created.status, 201);
        assert.equal(created.body.waiter.username, "anna"); // waiter comes from the token
        const id = created.body.id;

        for (const status of ["IN_PREPARATION", "SERVED", "PAID"]) {
            const res = await request(app).patch(`/api/orders/${id}/status`).set(auth).send({ status });
            assert.equal(res.status, 200);
            assert.equal(res.body.status, status);
        }

        const order = await request(app).get(`/api/orders/${id}`).set(auth);
        assert.ok(order.body.closedAt);
    });

    test("dish photo: manager uploads, anyone can view, waiter gets 403", async () => {
        const png = Buffer.from("89504e470d0a1a0a0000000d4948445200000001000000010806000000", "hex");
        const adminToken = await login("manager", "manager123");
        const waiterToken = await login("anna", "anna123");

        const waiter = await request(app)
            .put("/api/menu-items/1/image")
            .set("Authorization", `Bearer ${waiterToken}`)
            .set("Content-Type", "image/png")
            .send(png);
        assert.equal(waiter.status, 403);

        const upload = await request(app)
            .put("/api/menu-items/1/image")
            .set("Authorization", `Bearer ${adminToken}`)
            .set("Content-Type", "image/png")
            .send(png);
        assert.equal(upload.status, 200);
        assert.match(upload.body.imageUrl, /^\/api\/menu-items\/1\/image\?v=\d+$/);

        const image = await request(app).get("/api/menu-items/1/image"); // no token needed
        assert.equal(image.status, 200);
        assert.equal(image.headers["content-type"], "image/png");
        assert.deepEqual(image.body, png);

        const wrongType = await request(app)
            .put("/api/menu-items/1/image")
            .set("Authorization", `Bearer ${adminToken}`)
            .set("Content-Type", "text/plain")
            .send("hello");
        assert.equal(wrongType.status, 415);
    });

    test("API documentation is available", async () => {
        const res = await request(app).get("/api/docs.json");
        assert.equal(res.status, 200);
        assert.equal(res.body.openapi, "3.1.0");
    });
});
