const { AppError } = require("../errors/AppError");

function errorHandler(err, req, res, next) {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            error: {
                code: err.code,
                message: err.message,
                details: err.details,
                requestId: req.id
            }
        });
    }

    if (err.type === "entity.parse.failed") {
        return res.status(400).json({
            error: {
                code: "INVALID_JSON",
                message: "Request body is not valid JSON",
                requestId: req.id
            }
        });
    }

    // PostgreSQL: unique constraint violated (e.g. two requests at the same moment)
    if (err.code === "23505") {
        return res.status(409).json({
            error: {
                code: "UNIQUE_VIOLATION",
                message: "Resource already exists",
                requestId: req.id
            }
        });
    }

    // PostgreSQL: row is still referenced by another table
    if (err.code === "23503") {
        return res.status(409).json({
            error: {
                code: "RESOURCE_IN_USE",
                message: "Resource is used by other records",
                requestId: req.id
            }
        });
    }

    console.error(`[${req.id}]`, err);

    res.status(500).json({
        error: {
            code: "INTERNAL_ERROR",
            message: "Unexpected error",
            requestId: req.id
        }
    });
}

module.exports = errorHandler;