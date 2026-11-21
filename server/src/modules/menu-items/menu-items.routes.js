const { Router } = require("express");
const validate = require("../../middleware/validate");
const requireRole = require("../../middleware/requireRole");
const { idParams } = require("../../common/schemas");
const {
    createMenuItemBody,
    updateMenuItemBody,
    listMenuItemsQuery
} = require("./menu-items.schemas");

function createMenuItemsRouter(controller) {
    const router = Router();

    router.get("/", validate({ query: listMenuItemsQuery }), controller.list);
    router.get("/:id", validate({ params: idParams }), controller.getById);
    router.post("/", requireRole("ADMIN"), validate({ body: createMenuItemBody }), controller.create);
    router.patch(
        "/:id",
        requireRole("ADMIN"),
        validate({ params: idParams, body: updateMenuItemBody }),
        controller.update
    );
    router.delete("/:id", requireRole("ADMIN"), validate({ params: idParams }), controller.remove);

    return router;
}

module.exports = { createMenuItemsRouter };