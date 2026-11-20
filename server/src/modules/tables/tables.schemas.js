const { z } = require("zod");

const createTableBody = z.strictObject({
    number: z.number().int().positive(),
    seats: z.number().int().min(1).max(20)
});

const updateTableBody = z
    .strictObject({
        number: z.number().int().positive().optional(),
        seats: z.number().int().min(1).max(20).optional()
    })
    .refine(body => Object.keys(body).length > 0, { // Check whether request object has at least one key (field to be updated)
        message: "At least one field is required"
    });

module.exports = { createTableBody, updateTableBody };