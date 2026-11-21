const { z } = require("zod");
const { loginBody } = require("../modules/auth/auth.schemas");
const { createTableBody, updateTableBody } = require("../modules/tables/tables.schemas");
const { createMenuItemBody, updateMenuItemBody } = require("../modules/menu-items/menu-items.schemas");
const {
    createOrderBody,
    orderItemBody,
    updateOrderItemBody,
    changeStatusBody,
    STATUSES
} = require("../modules/orders/orders.schemas");

// request bodies are generated from the same Zod schemas that validate requests,
// so the documentation cannot drift away from the real validation
function fromZod(schema) {
    const { $schema, ...jsonSchema } = z.toJSONSchema(schema, { io: "input" });
    return jsonSchema;
}

function body(schema) {
    return { required: true, content: { "application/json": { schema: fromZod(schema) } } };
}

function ok(description, schemaRef) {
    const response = { description };
    if (schemaRef) response.content = { "application/json": { schema: { $ref: schemaRef } } };
    return response;
}

const error = description => ({
    description,
    content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } }
});

const idParam = name => ({ name, in: "path", required: true, schema: { type: "integer", minimum: 1 } });
const queryParam = (name, schema, description) => ({ name, in: "query", required: false, schema, description });
const pageParams = [
    queryParam("page", { type: "integer", minimum: 1, default: 1 }, "Page number"),
    queryParam("pageSize", { type: "integer", minimum: 1, maximum: 100, default: 20 }, "Items per page")
];

const E400 = error("Validation error (VALIDATION_ERROR, INVALID_JSON)");
const E401 = error("Missing, invalid or expired token");
const E403 = error("Logged in, but the role is not allowed (ADMIN only)");
const E404 = error("Resource not found");

const spec = {
    openapi: "3.1.0",
    info: {
        title: "RestoMenago API",
        version: "1.0.0",
        description:
            "REST API for waiters taking orders at restaurant tables. " +
            "Log in with POST /api/auth/login (manager / manager123 or anna / anna123), " +
            "copy the token and click Authorize."
    },
    servers: [{ url: "/" }],
    tags: [
        { name: "Auth" },
        { name: "Tables", description: "Reading: any logged-in user. Changes: ADMIN only." },
        { name: "Menu items", description: "Reading: any logged-in user. Changes: ADMIN only." },
        { name: "Orders", description: "Any logged-in user (WAITER or ADMIN)." }
    ],
    security: [{ bearerAuth: [] }],
    components: {
        securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
        schemas: {
            Error: {
                type: "object",
                properties: {
                    error: {
                        type: "object",
                        properties: {
                            code: { type: "string", examples: ["TABLE_ALREADY_HAS_ACTIVE_ORDER"] },
                            message: { type: "string" },
                            details: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        location: { type: "string" },
                                        field: { type: "string" },
                                        message: { type: "string" }
                                    }
                                }
                            },
                            requestId: { type: "string" }
                        }
                    }
                }
            },
            User: {
                type: "object",
                properties: {
                    id: { type: "integer" },
                    username: { type: "string" },
                    role: { type: "string", enum: ["WAITER", "ADMIN"] }
                }
            },
            Table: {
                type: "object",
                properties: {
                    id: { type: "integer" },
                    number: { type: "integer" },
                    seats: { type: "integer" },
                    createdAt: { type: "string", format: "date-time" }
                }
            },
            MenuItem: {
                type: "object",
                properties: {
                    id: { type: "integer" },
                    name: { type: "string" },
                    category: { type: "string", enum: ["STARTER", "SOUP", "MAIN", "DESSERT", "DRINK"] },
                    price: { type: "number" },
                    isAvailable: { type: "boolean" },
                    createdAt: { type: "string", format: "date-time" },
                    imageUrl: { type: ["string", "null"], examples: ["/api/menu-items/1/image?v=1795256400000"] }
                }
            },
            OrderSummary: {
                type: "object",
                properties: {
                    id: { type: "integer" },
                    table: { type: "object", properties: { id: { type: "integer" }, number: { type: "integer" } } },
                    waiter: { type: "object", properties: { id: { type: "integer" }, username: { type: "string" } } },
                    status: { type: "string", enum: STATUSES },
                    total: { type: "number" },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                    closedAt: { type: ["string", "null"], format: "date-time" }
                }
            },
            Order: {
                allOf: [
                    { $ref: "#/components/schemas/OrderSummary" },
                    {
                        type: "object",
                        properties: {
                            items: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        id: { type: "integer" },
                                        menuItemId: { type: "integer" },
                                        name: { type: "string" },
                                        quantity: { type: "integer" },
                                        unitPrice: { type: "number" },
                                        lineTotal: { type: "number" },
                                        note: { type: ["string", "null"] }
                                    }
                                }
                            }
                        }
                    }
                ]
            },
            Pagination: {
                type: "object",
                properties: {
                    page: { type: "integer" },
                    pageSize: { type: "integer" },
                    total: { type: "integer" },
                    totalPages: { type: "integer" }
                }
            }
        }
    },
    paths: {
        "/api/health": {
            get: {
                tags: ["Auth"],
                summary: "Server and database health check",
                security: [],
                responses: { 200: ok("Server and database are up"), 500: error("Database is down") }
            }
        },
        "/api/auth/login": {
            post: {
                tags: ["Auth"],
                summary: "Log in and receive a JWT token",
                security: [],
                requestBody: body(loginBody),
                responses: {
                    200: {
                        description: "Token and user",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: { token: { type: "string" }, user: { $ref: "#/components/schemas/User" } }
                                }
                            }
                        }
                    },
                    400: E400,
                    401: error("Invalid username or password")
                }
            }
        },
        "/api/auth/me": {
            get: {
                tags: ["Auth"],
                summary: "Currently logged-in user",
                responses: { 200: ok("Current user", "#/components/schemas/User"), 401: E401 }
            }
        },
        "/api/tables": {
            get: {
                tags: ["Tables"],
                summary: "List tables",
                responses: {
                    200: {
                        description: "All tables ordered by number",
                        content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Table" } } } }
                    },
                    401: E401
                }
            },
            post: {
                tags: ["Tables"],
                summary: "Add a table (ADMIN)",
                requestBody: body(createTableBody),
                responses: {
                    201: ok("Created, Location header points to the new table", "#/components/schemas/Table"),
                    400: E400,
                    401: E401,
                    403: E403,
                    409: error("TABLE_NUMBER_TAKEN")
                }
            }
        },
        "/api/tables/{id}": {
            parameters: [idParam("id")],
            get: {
                tags: ["Tables"],
                summary: "Get one table",
                responses: { 200: ok("Table", "#/components/schemas/Table"), 400: E400, 401: E401, 404: E404 }
            },
            patch: {
                tags: ["Tables"],
                summary: "Change table number or seats (ADMIN)",
                requestBody: body(updateTableBody),
                responses: {
                    200: ok("Updated table", "#/components/schemas/Table"),
                    400: E400,
                    401: E401,
                    403: E403,
                    404: E404,
                    409: error("TABLE_NUMBER_TAKEN")
                }
            },
            delete: {
                tags: ["Tables"],
                summary: "Delete a table (ADMIN)",
                responses: {
                    204: ok("Deleted"),
                    400: E400,
                    401: E401,
                    403: E403,
                    404: E404,
                    409: error("TABLE_HAS_ORDERS")
                }
            }
        },
        "/api/menu-items": {
            get: {
                tags: ["Menu items"],
                summary: "List menu items with pagination, filtering and search",
                parameters: [
                    ...pageParams,
                    queryParam("category", { type: "string", enum: ["STARTER", "SOUP", "MAIN", "DESSERT", "DRINK"] }),
                    queryParam("available", { type: "string", enum: ["true", "false"] }),
                    queryParam("search", { type: "string" }, "Part of the dish name")
                ],
                responses: {
                    200: {
                        description: "One page of menu items",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        data: { type: "array", items: { $ref: "#/components/schemas/MenuItem" } },
                                        pagination: { $ref: "#/components/schemas/Pagination" }
                                    }
                                }
                            }
                        }
                    },
                    400: E400,
                    401: E401
                }
            },
            post: {
                tags: ["Menu items"],
                summary: "Add a dish (ADMIN)",
                requestBody: body(createMenuItemBody),
                responses: {
                    201: ok("Created", "#/components/schemas/MenuItem"),
                    400: E400,
                    401: E401,
                    403: E403,
                    409: error("MENU_ITEM_NAME_TAKEN")
                }
            }
        },
        "/api/menu-items/{id}": {
            parameters: [idParam("id")],
            get: {
                tags: ["Menu items"],
                summary: "Get one dish",
                responses: { 200: ok("Dish", "#/components/schemas/MenuItem"), 400: E400, 401: E401, 404: E404 }
            },
            patch: {
                tags: ["Menu items"],
                summary: "Edit a dish or withdraw it with isAvailable: false (ADMIN)",
                requestBody: body(updateMenuItemBody),
                responses: {
                    200: ok("Updated dish", "#/components/schemas/MenuItem"),
                    400: E400,
                    401: E401,
                    403: E403,
                    404: E404,
                    409: error("MENU_ITEM_NAME_TAKEN")
                }
            },
            delete: {
                tags: ["Menu items"],
                summary: "Delete a dish that was never ordered (ADMIN)",
                responses: {
                    204: ok("Deleted"),
                    400: E400,
                    401: E401,
                    403: E403,
                    404: E404,
                    409: error("MENU_ITEM_IN_USE")
                }
            }
        },
        "/api/menu-items/{id}/image": {
            parameters: [idParam("id")],
            get: {
                tags: ["Menu items"],
                summary: "Dish photo (public, used by <img> tags)",
                security: [],
                responses: {
                    200: { description: "The image", content: { "image/png": {}, "image/jpeg": {}, "image/webp": {} } },
                    404: E404
                }
            },
            put: {
                tags: ["Menu items"],
                summary: "Upload or replace the dish photo (ADMIN). Body = the image file, max 2 MB",
                requestBody: {
                    required: true,
                    content: {
                        "image/png": { schema: { type: "string", format: "binary" } },
                        "image/jpeg": { schema: { type: "string", format: "binary" } },
                        "image/webp": { schema: { type: "string", format: "binary" } }
                    }
                },
                responses: {
                    200: ok("Dish with the new imageUrl", "#/components/schemas/MenuItem"),
                    401: E401,
                    403: E403,
                    404: E404,
                    413: error("PAYLOAD_TOO_LARGE"),
                    415: error("UNSUPPORTED_IMAGE")
                }
            },
            delete: {
                tags: ["Menu items"],
                summary: "Remove the dish photo (ADMIN)",
                responses: { 200: ok("Dish without a photo", "#/components/schemas/MenuItem"), 401: E401, 403: E403, 404: E404 }
            }
        },
        "/api/orders": {
            get: {
                tags: ["Orders"],
                summary: "List orders with pagination and filtering",
                parameters: [
                    ...pageParams,
                    queryParam("status", { type: "string", enum: STATUSES }),
                    queryParam("tableId", { type: "integer", minimum: 1 })
                ],
                responses: {
                    200: {
                        description: "One page of orders, newest first",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        data: { type: "array", items: { $ref: "#/components/schemas/OrderSummary" } },
                                        pagination: { $ref: "#/components/schemas/Pagination" }
                                    }
                                }
                            }
                        }
                    },
                    400: E400,
                    401: E401
                }
            },
            post: {
                tags: ["Orders"],
                summary: "Open an order for a table (waiter is taken from the token)",
                requestBody: body(createOrderBody),
                responses: {
                    201: ok("Created order with items", "#/components/schemas/Order"),
                    400: E400,
                    401: E401,
                    404: E404,
                    409: error("TABLE_ALREADY_HAS_ACTIVE_ORDER, MENU_ITEM_UNAVAILABLE")
                }
            }
        },
        "/api/orders/{id}": {
            parameters: [idParam("id")],
            get: {
                tags: ["Orders"],
                summary: "Get an order with its items",
                responses: { 200: ok("Order", "#/components/schemas/Order"), 400: E400, 401: E401, 404: E404 }
            }
        },
        "/api/orders/{id}/status": {
            parameters: [idParam("id")],
            patch: {
                tags: ["Orders"],
                summary: "Change status: OPEN → IN_PREPARATION → SERVED → PAID, or CANCELLED before serving",
                requestBody: body(changeStatusBody),
                responses: {
                    200: ok("Order after the change", "#/components/schemas/Order"),
                    400: E400,
                    401: E401,
                    404: E404,
                    409: error("INVALID_STATUS_TRANSITION, ORDER_EMPTY")
                }
            }
        },
        "/api/orders/{id}/items": {
            parameters: [idParam("id")],
            post: {
                tags: ["Orders"],
                summary: "Add an item (only OPEN or IN_PREPARATION)",
                requestBody: body(orderItemBody),
                responses: {
                    201: ok("Order after the change", "#/components/schemas/Order"),
                    400: E400,
                    401: E401,
                    404: E404,
                    409: error("ORDER_NOT_EDITABLE, MENU_ITEM_UNAVAILABLE")
                }
            }
        },
        "/api/orders/{id}/items/{itemId}": {
            parameters: [idParam("id"), idParam("itemId")],
            patch: {
                tags: ["Orders"],
                summary: "Change quantity or note of an item",
                requestBody: body(updateOrderItemBody),
                responses: {
                    200: ok("Order after the change", "#/components/schemas/Order"),
                    400: E400,
                    401: E401,
                    404: E404,
                    409: error("ORDER_NOT_EDITABLE")
                }
            },
            delete: {
                tags: ["Orders"],
                summary: "Remove an item",
                responses: {
                    200: ok("Order after the change", "#/components/schemas/Order"),
                    400: E400,
                    401: E401,
                    404: E404,
                    409: error("ORDER_NOT_EDITABLE")
                }
            }
        }
    }
};

module.exports = spec;
