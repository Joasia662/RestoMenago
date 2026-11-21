const { toUserResponse } = require("./auth.mapper");

function createAuthController(authService) {
    return {
        async login(req, res) {
            const { token, user } = await authService.login(req.validated.body);
            res.json({ token, user: toUserResponse(user) });
        },

        async me(req, res) {
            const user = await authService.getCurrentUser(req.user.id);
            res.json(toUserResponse(user));
        }
    };
}

module.exports = { createAuthController };