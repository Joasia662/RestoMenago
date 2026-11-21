// Listeners react to order events without the orders service knowing about them.
// Here they print a kitchen ticket and an activity log; in a bigger system the
// same events could send a notification, update statistics or call another service.
function registerOrderListeners(events, { log = console.log } = {}) {
    events.on("order.created", ({ order }) => {
        log(`[activity] ${order.waiter.username} opened order #${order.id} for table ${order.table.number}`);
    });

    events.on("order.statusChanged", ({ order, from, to }) => {
        log(`[activity] order #${order.id} (table ${order.table.number}): ${from} -> ${to}`);

        if (to === "IN_PREPARATION") {
            const lines = order.items.map(item => {
                const note = item.note ? ` (${item.note})` : "";
                return `  ${item.quantity} x ${item.name}${note}`;
            });
            log([`[kitchen] new ticket: order #${order.id}, table ${order.table.number}`, ...lines].join("\n"));
        }

        if (to === "PAID") {
            log(`[activity] table ${order.table.number} is free again, paid ${order.total.toFixed(2)} PLN`);
        }
    });
}

module.exports = { registerOrderListeners };
