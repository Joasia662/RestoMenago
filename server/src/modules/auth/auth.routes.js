const { Router } = require("express");
const validate = require("../../middleware/validate");
const { loginBody } = require("./auth.schemas");

function createAuthRouter(controller, authenticate) {
    const router = Router();

    router.post("/login", validate({ body: loginBody }), controller.login);
    router.get("/me", authenticate, controller.me);

    return router;
}

module.exports = { createAuthRouter };