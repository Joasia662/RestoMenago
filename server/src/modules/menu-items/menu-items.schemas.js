const { z } = require("zod");
const { pagination } = require("../../common/schemas");

const CATEGORIES = ["STARTER", "SOUP", "MAIN", "DESSERT", "DRINK"];

const name = z.string().trim().min(2).max(120);
const category = z.enum(CATEGORIES);
const price = z.number().min(0).max(10000);

const createMenuItemBody = z.strictObject({
    name,
    category,
    price,
    isAvailable: z.boolean().default(true)
});

const updateMenuItemBody = z
    .strictObject({
        name: name.optional(),
        category: category.optional(),
        price: price.optional(),
        isAvailable: z.boolean().optional()
    })
    .refine(body => Object.keys(body).length > 0, {
        message: "At least one field is required"
    });

const listMenuItemsQuery = z.object({
    ...pagination,
    category: category.optional(),
    available: z.enum(["true", "false"]).transform(value => value === "true").optional(),
    search: z.string().trim().min(1).max(50).optional()
});

module.exports = { createMenuItemBody, updateMenuItemBody, listMenuItemsQuery, CATEGORIES };