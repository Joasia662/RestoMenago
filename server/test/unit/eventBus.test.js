const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { createEventBus } = require("../../src/events/eventBus");

const nextTick = () => new Promise(resolve => setImmediate(resolve));

describe("eventBus", () => {
    test("runs listeners asynchronously, after emit() has returned", async () => {
        const events = createEventBus();
        const received = [];
        events.on("order.created", payload => received.push(payload.order.id));

        events.emit("order.created", { order: { id: 7 } });
        assert.deepEqual(received, []); // nothing yet: the request is not blocked

        await nextTick();
        assert.deepEqual(received, [7]);
    });

    test("a failing listener does not break the others", async () => {
        const events = createEventBus();
        const received = [];
        const originalError = console.error;
        console.error = () => {}; // keep the test output clean

        events.on("order.created", () => {
            throw new Error("boom");
        });
        events.on("order.created", payload => received.push(payload.order.id));

        events.emit("order.created", { order: { id: 8 } });
        await nextTick();
        await nextTick();

        console.error = originalError;
        assert.deepEqual(received, [8]);
    });
});
