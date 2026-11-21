const { NotFoundError, ConflictError } = require("../../errors/AppError");

// state machine: current status -> statuses it may change to
const ALLOWED_TRANSITIONS = {
    OPEN: ["IN_PREPARATION", "CANCELLED"],
    IN_PREPARATION: ["SERVED", "CANCELLED"],
    SERVED: ["PAID"],
    PAID: [],
    CANCELLED: []
};

const EDITABLE_STATUSES = ["OPEN", "IN_PREPARATION"];
const CLOSED_STATUSES = ["PAID", "CANCELLED"];

function createOrdersService({ repositories, runInTransaction, now = () => new Date() }) {
    async function getOrder(id) {
        const order = await repositories.orders.findDetailsById(id);
        if (!order) throw new NotFoundError("Order");
        return order;
    }

    async function addItemToOrder(repos, orderId, { menuItemId, quantity, note }) {
        const menuItem = await repos.menuItems.findById(menuItemId);
        if (!menuItem) throw new NotFoundError("Menu item");
        if (!menuItem.isAvailable) {
            throw new ConflictError(
                `Menu item "${menuItem.name}" is not available`,
                "MENU_ITEM_UNAVAILABLE"
            );
        }

        // unitPrice is copied from the menu - later price changes do not affect this order
        return repos.orders.addItem(orderId, {
            menuItemId,
            quantity,
            unitPrice: menuItem.price,
            note
        });
    }

    async function lockEditableOrder(repos, orderId) {
        const order = await repos.orders.findById(orderId, { forUpdate: true });
        if (!order) throw new NotFoundError("Order");
        if (!EDITABLE_STATUSES.includes(order.status)) {
            throw new ConflictError(
                `Order with status ${order.status} cannot be modified`,
                "ORDER_NOT_EDITABLE"
            );
        }
        return order;
    }

    return {
        listOrders(filters) {
            return repositories.orders.list(filters);
        },

        getOrder,

        async createOrder({ tableId, waiterId, items }) {
            const orderId = await runInTransaction(async repos => {
                const table = await repos.tables.findById(tableId);
                if (!table) throw new NotFoundError("Table");

                const waiter = await repos.users.findById(waiterId);
                if (!waiter) throw new NotFoundError("Waiter");

                const active = await repos.orders.findActiveByTable(tableId);
                if (active) {
                    throw new ConflictError(
                        "Table already has an active order",
                        "TABLE_ALREADY_HAS_ACTIVE_ORDER"
                    );
                }

                const order = await repos.orders.create({ tableId, waiterId, createdAt: now() });

                for (const item of items) {
                    await addItemToOrder(repos, order.id, item);
                }

                return order.id;
            });

            return getOrder(orderId);
        },

        async addItem(orderId, item) {
            await runInTransaction(async repos => {
                await lockEditableOrder(repos, orderId);
                await addItemToOrder(repos, orderId, item);
                await repos.orders.touch(orderId, now());
            });

            return getOrder(orderId);
        },

        async updateItem(orderId, itemId, changes) {
            await runInTransaction(async repos => {
                await lockEditableOrder(repos, orderId);

                const item = await repos.orders.findItem(orderId, itemId);
                if (!item) throw new NotFoundError("Order item");

                await repos.orders.updateItem(itemId, changes);
                await repos.orders.touch(orderId, now());
            });

            return getOrder(orderId);
        },

        async removeItem(orderId, itemId) {
            await runInTransaction(async repos => {
                await lockEditableOrder(repos, orderId);

                const item = await repos.orders.findItem(orderId, itemId);
                if (!item) throw new NotFoundError("Order item");

                await repos.orders.removeItem(itemId);
                await repos.orders.touch(orderId, now());
            });

            return getOrder(orderId);
        },

        async changeStatus(orderId, newStatus) {
            await runInTransaction(async repos => {
                const order = await repos.orders.findById(orderId, { forUpdate: true });
                if (!order) throw new NotFoundError("Order");

                // idempotent: asking for the current status changes nothing
                if (order.status === newStatus) return;

                if (!ALLOWED_TRANSITIONS[order.status].includes(newStatus)) {
                    throw new ConflictError(
                        `Cannot change status from ${order.status} to ${newStatus}`,
                        "INVALID_STATUS_TRANSITION"
                    );
                }

                if (newStatus === "IN_PREPARATION") {
                    const itemsCount = await repos.orders.countItems(orderId);
                    if (itemsCount === 0) {
                        throw new ConflictError("Order has no items", "ORDER_EMPTY");
                    }
                }

                const timestamp = now();
                await repos.orders.updateStatus(orderId, {
                    status: newStatus,
                    updatedAt: timestamp,
                    closedAt: CLOSED_STATUSES.includes(newStatus) ? timestamp : null
                });
            });

            return getOrder(orderId);
        }
    };
}

module.exports = { createOrdersService, ALLOWED_TRANSITIONS };
