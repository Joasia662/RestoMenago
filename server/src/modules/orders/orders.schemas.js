const { z } = require("zod");
const { id, pagination } = require("../../common/schemas");

const STATUSES = ["OPEN", "IN_PREPARATION", "SERVED", "PAID", "CANCELLED"];

const positiveInt = z.number().int().positive();
const quantity = z.number().int().min(1).max(50);
const note = z.string().trim().max(255);

const orderItemBody = z.strictObject({
    menuItemId: positiveInt,
    quantity,
    note: note.optional()
});

const createOrderBody = z.strictObject({
    tableId: positiveInt,
    items: z.array(orderItemBody).max(50).default([])
});

const updateOrderItemBody = z
    .strictObject({
        quantity: quantity.optional(),
        note: note.nullable().optional()
    })
    .refine(body => Object.keys(body).length > 0, {
        message: "At least one field is required"
    });

const changeStatusBody = z.strictObject({
    status: z.enum(STATUSES)
});

const listOrdersQuery = z.object({
    ...pagination,
    status: z.enum(STATUSES).optional(),
    tableId: id.optional()
});

const orderItemParams = z.object({ id, itemId: id });

module.exports = {
    STATUSES,
    orderItemBody,
    createOrderBody,
    updateOrderItemBody,
    changeStatusBody,
    listOrdersQuery,
    orderItemParams
};