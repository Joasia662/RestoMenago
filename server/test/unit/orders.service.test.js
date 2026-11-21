const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { createOrdersService } = require("../../src/modules/orders/orders.service");
const { ConflictError } = require("../../src/errors/AppError");

const FIXED_NOW = new Date("2026-11-21T12:00:00Z");

// fake repositories instead of a database: the service only needs these methods
function createFakes({ order = null, activeOrder = null, menuItem = null, itemsCount = 1 } = {}) {
    const calls = { createdOrders: [], addedItems: [], statusUpdates: [] };

    const repos = {
        tables: { findById: async id => ({ id, number: id, seats: 4 }) },
        users: { findById: async id => ({ id, username: "anna", role: "WAITER" }) },
        menuItems: { findById: async () => menuItem },
        orders: {
            findActiveByTable: async () => activeOrder,
            findById: async () => order,
            countItems: async () => itemsCount,
            create: async data => {
                calls.createdOrders.push(data);
                return { id: 10, ...data, status: "OPEN" };
            },
            addItem: async (orderId, item) => {
                calls.addedItems.push({ orderId, ...item });
                return 1;
            },
            updateStatus: async (id, data) => calls.statusUpdates.push({ id, ...data }),
            touch: async () => {},
            findDetailsById: async id => ({ id, items: [] })
        }
    };

    const service = createOrdersService({
        repositories: repos,
        runInTransaction: fn => fn(repos), // no real transaction in unit tests
        now: () => FIXED_NOW
    });

    return { service, calls };
}

describe("orders.service", () => {
    test("does not open a second order for a table that already has an active one", async () => {
        const { service, calls } = createFakes({ activeOrder: { id: 1, status: "OPEN" } });

        await assert.rejects(
            service.createOrder({ tableId: 3, waiterId: 2, items: [] }),
            err => err instanceof ConflictError && err.code === "TABLE_ALREADY_HAS_ACTIVE_ORDER"
        );
        assert.equal(calls.createdOrders.length, 0);
    });

    test("does not allow ordering an unavailable dish", async () => {
        const { service } = createFakes({
            menuItem: { id: 7, name: "Seasonal special", price: 42, isAvailable: false }
        });

        await assert.rejects(
            service.createOrder({ tableId: 2, waiterId: 2, items: [{ menuItemId: 7, quantity: 1 }] }),
            err => err.code === "MENU_ITEM_UNAVAILABLE"
        );
    });

    test("copies the current menu price into the order item", async () => {
        const { service, calls } = createFakes({
            menuItem: { id: 2, name: "Pierogi ruskie", price: 28, isAvailable: true }
        });

        await service.createOrder({ tableId: 2, waiterId: 2, items: [{ menuItemId: 2, quantity: 2 }] });

        assert.equal(calls.addedItems.length, 1);
        assert.equal(calls.addedItems[0].unitPrice, 28);
        assert.equal(calls.addedItems[0].quantity, 2);
    });

    test("rejects a status change that the state machine does not allow (PAID -> OPEN)", async () => {
        const { service, calls } = createFakes({ order: { id: 5, status: "PAID" } });

        await assert.rejects(
            service.changeStatus(5, "OPEN"),
            err => err.code === "INVALID_STATUS_TRANSITION" && err.statusCode === 409
        );
        assert.equal(calls.statusUpdates.length, 0);
    });

    test("does not send an empty order to the kitchen", async () => {
        const { service } = createFakes({ order: { id: 4, status: "OPEN" }, itemsCount: 0 });

        await assert.rejects(service.changeStatus(4, "IN_PREPARATION"), err => err.code === "ORDER_EMPTY");
    });

    test("sets closedAt when an order is paid", async () => {
        const { service, calls } = createFakes({ order: { id: 5, status: "SERVED" } });

        await service.changeStatus(5, "PAID");

        assert.deepEqual(calls.statusUpdates, [
            { id: 5, status: "PAID", updatedAt: FIXED_NOW, closedAt: FIXED_NOW }
        ]);
    });

    test("does not allow adding items to a served order", async () => {
        const { service } = createFakes({
            order: { id: 5, status: "SERVED" },
            menuItem: { id: 1, name: "Zupa pomidorowa", price: 14, isAvailable: true }
        });

        await assert.rejects(
            service.addItem(5, { menuItemId: 1, quantity: 1 }),
            err => err.code === "ORDER_NOT_EDITABLE"
        );
    });
});
