const express = require("express");
const requestLogger = require("./middleware/requestLogger");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

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

function createApp({ db, repositories, runInTransaction }) {
    const app = express();

    app.use(requestLogger);
    app.use(express.json());

    app.get("/api/health", async (req, res) => {
        await db.raw("SELECT 1");
        res.json({ status: "ok", database: "up" });
    });

    // temporary - shows how an unexpected error is handled (500)
    //app.get("/api/debug/crash", () => {
    //    throw new Error("boom");
    //});

    const tablesService = createTablesService({
        tablesRepository: repositories.tables,
        ordersRepository: repositories.orders
    });
    app.use("/api/tables", createTablesRouter(createTablesController(tablesService)));

    const menuItemsService = createMenuItemsService({
        menuItemsRepository: repositories.menuItems,
        ordersRepository: repositories.orders
    });
    app.use(
        "/api/menu-items",
        createMenuItemsRouter(createMenuItemsController(menuItemsService))
    );

    const ordersService = createOrdersService({ repositories, runInTransaction });
    app.use("/api/orders", createOrdersRouter(createOrdersController(ordersService)));

    app.use(notFound);
    app.use(errorHandler);

    return app;
}

module.exports = { createApp };