const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../errors/AppError");

function createAuthenticate(jwtSecret) {
    return (req, res, next) => {
        const header = req.get("Authorization") || "";
        const [scheme, token] = header.split(" ");

        if (scheme !== "Bearer" || !token) {
            return next(new UnauthorizedError("Missing or invalid Authorization header"));
        }

        try {
            const payload = jwt.verify(token, jwtSecret);
            req.user = { id: Number(payload.sub), username: payload.username, role: payload.role };
            next();
        } catch {
            next(new UnauthorizedError("Invalid or expired token"));
        }
    };
}

module.exports = { createAuthenticate };