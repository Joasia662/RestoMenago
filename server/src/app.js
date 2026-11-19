const express = require("express");
const requestLogger = require("./middleware/requestLogger");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

function createApp({ db }) {
    const app = express();

    app.use(requestLogger);
    app.use(express.json());

    app.get("/api/health", async (req, res) => {
        await db.raw("SELECT 1");
        res.json({ status: "ok", database: "up" });
    });

    // temporary - shows how an unexpected error is handled (500)
    app.get("/api/debug/crash", () => {
        throw new Error("boom");
    });

    app.use(notFound);
    app.use(errorHandler);

    return app;
}

module.exports = { createApp };