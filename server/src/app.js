const express = require("express");
const requestLogger = require("./middleware/requestLogger");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

// Table module
const { createTablesService } = require("./modules/tables/tables.service");
const { createTablesController } = require("./modules/tables/tables.controller");
const { createTablesRouter } = require("./modules/tables/tables.routes");

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

    app.use(notFound);
    app.use(errorHandler);

    return app;
}

module.exports = { createApp };