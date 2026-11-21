function toOrder(row) {
    return {
        id: row.id,
        tableId: row.table_id,
        waiterId: row.waiter_id,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        closedAt: row.closed_at
    };
}

function toOrderItem(row) {
    return {
        id: row.id,
        orderId: row.order_id,
        menuItemId: row.menu_item_id,
        name: row.name,
        quantity: row.quantity,
        unitPrice: Number(row.unit_price),
        note: row.note
    };
}

const ACTIVE_STATUSES = ["OPEN", "IN_PREPARATION", "SERVED"];

function createOrdersRepository(db) {
    function baseListQuery() {
        return db("orders as o")
            .join("tables as t", "t.id", "o.table_id")
            .join("users as u", "u.id", "o.waiter_id");
    }

    const summaryColumns = [
        "o.*",
        "t.number as table_number",
        "u.username as waiter_username",
        db.raw(
            "(SELECT COALESCE(SUM(quantity * unit_price), 0) FROM order_items WHERE order_id = o.id) AS total"
        )
    ];

    function toSummary(row) {
        return {
            ...toOrder(row),
            table: { id: row.table_id, number: row.table_number },
            waiter: { id: row.waiter_id, username: row.waiter_username },
            total: Number(row.total)
        };
    }

    return {
        async list({ status, tableId, page, pageSize }) {
            const query = baseListQuery();
            if (status) query.where("o.status", status);
            if (tableId) query.where("o.table_id", tableId);

            const [{ count }] = await query.clone().count();
            const rows = await query
                .select(summaryColumns)
                .orderBy("o.created_at", "desc")
                .orderBy("o.id", "desc")
                .limit(pageSize)
                .offset((page - 1) * pageSize);

            return { items: rows.map(toSummary), total: Number(count) };
        },

        // order + table + waiter + items in 2 queries (no N+1)
        async findDetailsById(id) {
            const row = await baseListQuery().select(summaryColumns).where("o.id", id).first();
            if (!row) return null;

            const itemRows = await db("order_items as oi")
                .join("menu_items as m", "m.id", "oi.menu_item_id")
                .select("oi.*", "m.name")
                .where("oi.order_id", id)
                .orderBy("oi.id");

            return { ...toSummary(row), items: itemRows.map(toOrderItem) };
        },

        async findById(id, { forUpdate = false } = {}) {
            const query = db("orders").where({ id }).first();
            if (forUpdate) query.forUpdate();
            const row = await query;
            return row ? toOrder(row) : null;
        },

        async findActiveByTable(tableId) {
            const row = await db("orders")
                .where({ table_id: tableId })
                .whereIn("status", ACTIVE_STATUSES)
                .first();
            return row ? toOrder(row) : null;
        },

        async countByTable(tableId) {
            const [{ count }] = await db("orders").where({ table_id: tableId }).count();
            return Number(count);
        },

        async countItemsByMenuItem(menuItemId) {
            const [{ count }] = await db("order_items")
                .where({ menu_item_id: menuItemId })
                .count();
            return Number(count);
        },

        async countItems(orderId) {
            const [{ count }] = await db("order_items").where({ order_id: orderId }).count();
            return Number(count);
        },

        async create({ tableId, waiterId, createdAt }) {
            const [row] = await db("orders")
                .insert({
                    table_id: tableId,
                    waiter_id: waiterId,
                    status: "OPEN",
                    created_at: createdAt,
                    updated_at: createdAt
                })
                .returning("*");
            return toOrder(row);
        },

        async updateStatus(id, { status, updatedAt, closedAt }) {
            const [row] = await db("orders")
                .where({ id })
                .update({ status, updated_at: updatedAt, closed_at: closedAt })
                .returning("*");
            return toOrder(row);
        },

        async touch(id, updatedAt) {
            await db("orders").where({ id }).update({ updated_at: updatedAt });
        },

        async addItem(orderId, { menuItemId, quantity, unitPrice, note }) {
            const [row] = await db("order_items")
                .insert({
                    order_id: orderId,
                    menu_item_id: menuItemId,
                    quantity,
                    unit_price: unitPrice,
                    note: note ?? null
                })
                .returning("id");
            return row.id;
        },

        async findItem(orderId, itemId) {
            const row = await db("order_items").where({ id: itemId, order_id: orderId }).first();
            return row ? toOrderItem(row) : null;
        },

        async updateItem(itemId, { quantity, note }) {
            const changes = {};
            if (quantity !== undefined) changes.quantity = quantity;
            if (note !== undefined) changes.note = note;
            await db("order_items").where({ id: itemId }).update(changes);
        },

        async removeItem(itemId) {
            await db("order_items").where({ id: itemId }).del();
        }
    };
}

module.exports = { createOrdersRepository, ACTIVE_STATUSES };
