const express = require("express");
const swaggerUi = require("swagger-ui-express");
const openApiSpec = require("./docs/openapi");
const requestLogger = require("./middleware/requestLogger");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");
const { createAuthenticate } = require("./middleware/authenticate");
const validate = require("./middleware/validate");
const { idParams } = require("./common/schemas");

// Auth module
const { createAuthService } = require("./modules/auth/auth.service");
const { createAuthController } = require("./modules/auth/auth.controller");
const { createAuthRouter } = require("./modules/auth/auth.routes");

// Table module
const { createTablesService } = require("./modules/tables/tables.service");
const { createTablesController } = require("./modules/tables/tables.controller");
const { createTablesRouter } = require("./modules/tables/tables.routes");

// Menu items module
const { createMenuItemsService } = require("./modules/menu-items/menu-items.service");
const { createMenuItemsController } = require("./modules/menu-items/menu-items.controller");
const { createMenuItemsRouter } = require("./modules/menu-items/menu-items.routes");

// Orders module
const { createOrdersService } = require("./modules/orders/orders.service");
const { createOrdersController } = require("./modules/orders/orders.controller");
const { createOrdersRouter } = require("./modules/orders/orders.routes");

function createApp({ db, repositories, runInTransaction, config, events }) {
    const app = express();

    app.use(requestLogger);
    app.use(express.json());

    app.get("/api/health", async (req, res) => {
        await db.raw("SELECT 1");
        res.json({ status: "ok", database: "up" });
    });

    // API documentation (Swagger UI) - public, like the login endpoint
    app.get("/api/docs.json", (req, res) => res.json(openApiSpec));
    app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

    const authenticate = createAuthenticate(config.jwtSecret);

    const authService = createAuthService({
        usersRepository: repositories.users,
        jwtSecret: config.jwtSecret,
        jwtExpiresIn: config.jwtExpiresIn
    });
    app.use("/api/auth", createAuthRouter(createAuthController(authService), authenticate));

    const tablesService = createTablesService({
        tablesRepository: repositories.tables,
        ordersRepository: repositories.orders
    });
    app.use("/api/tables", authenticate, createTablesRouter(createTablesController(tablesService)));

    const menuItemsService = createMenuItemsService({
        menuItemsRepository: repositories.menuItems,
        ordersRepository: repositories.orders
    });
    const menuItemsController = createMenuItemsController(menuItemsService);
    // dish photos are public: an <img> tag cannot send the Authorization header
    app.get("/api/menu-items/:id/image", validate({ params: idParams }), menuItemsController.getImage);
    app.use("/api/menu-items", authenticate, createMenuItemsRouter(menuItemsController));

    const ordersService = createOrdersService({ repositories, runInTransaction, events });
    app.use("/api/orders", authenticate, createOrdersRouter(createOrdersController(ordersService)));

    app.use(notFound);
    app.use(errorHandler);

    return app;
}

module.exports = { createApp };