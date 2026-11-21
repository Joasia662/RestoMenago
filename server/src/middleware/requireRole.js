const { ForbiddenError } = require("../errors/AppError");

function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!allowedRoles.includes(req.user.role)) {
            return next(new ForbiddenError(`Requires role: ${allowedRoles.join(" or ")}`));
        }
        next();
    };
}

module.exports = requireRole;