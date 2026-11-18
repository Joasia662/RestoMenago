const express = require("express");
const requestLogger = require("./middleware/requestLogger");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

function createApp() {
    const app = express();

    app.use(requestLogger);
    app.use(express.json());

    app.get("/api/health", (req, res) => {
        res.json({ status: "ok" });
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