const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { createTablesService } = require("../../src/modules/tables/tables.service");
const { NotFoundError } = require("../../src/errors/AppError");

function createFakes({ tables = [], ordersPerTable = {} } = {}) {
    const removed = [];
    const tablesRepository = {
        findById: async id => tables.find(t => t.id === id) ?? null,
        findByNumber: async number => tables.find(t => t.number === number) ?? null,
        create: async data => ({ id: 99, ...data }),
        remove: async id => removed.push(id)
    };
    const ordersRepository = { countByTable: async id => ordersPerTable[id] ?? 0 };

    return { service: createTablesService({ tablesRepository, ordersRepository }), removed };
}

describe("tables.service", () => {
    test("does not delete a table that has orders", async () => {
        const { service, removed } = createFakes({ tables: [{ id: 3, number: 3, seats: 4 }], ordersPerTable: { 3: 1 } });

        await assert.rejects(service.deleteTable(3), err => err.code === "TABLE_HAS_ORDERS");
        assert.deepEqual(removed, []);
    });

    test("does not create two tables with the same number", async () => {
        const { service } = createFakes({ tables: [{ id: 1, number: 1, seats: 2 }] });

        await assert.rejects(service.createTable({ number: 1, seats: 4 }), err => err.code === "TABLE_NUMBER_TAKEN");
    });

    test("throws NotFoundError for a missing table", async () => {
        const { service } = createFakes();

        await assert.rejects(service.getTable(42), NotFoundError);
    });
});
