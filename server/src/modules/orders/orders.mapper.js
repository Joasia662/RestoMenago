function toIso(value) {
    return value ? new Date(value).toISOString() : null;
}

function toOrderSummaryResponse(order) {
    return {
        id: order.id,
        table: { id: order.table.id, number: order.table.number },
        waiter: { id: order.waiter.id, username: order.waiter.username },
        status: order.status,
        total: order.total,
        createdAt: toIso(order.createdAt),
        updatedAt: toIso(order.updatedAt),
        closedAt: toIso(order.closedAt)
    };
}

function toOrderItemResponse(item) {
    return {
        id: item.id,
        menuItemId: item.menuItemId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: Math.round(item.quantity * item.unitPrice * 100) / 100,
        note: item.note ?? null
    };
}

function toOrderResponse(order) {
    return {
        ...toOrderSummaryResponse(order),
        items: order.items.map(toOrderItemResponse)
    };
}

module.exports = { toOrderSummaryResponse, toOrderResponse };