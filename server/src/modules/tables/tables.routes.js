const { Router } = require("express");
const validate = require("../../middleware/validate");
const requireRole = require("../../middleware/requireRole");
const { idParams } = require("../../common/schemas");
const { createTableBody, updateTableBody } = require("./tables.schemas");

function createTablesRouter(controller) {
    const router = Router();

    router.get("/", controller.list);
    router.get("/:id", validate({ params: idParams }), controller.getById);
    router.post("/", requireRole("ADMIN"), validate({ body: createTableBody }), controller.create);
    router.patch(
        "/:id",
        requireRole("ADMIN"),
        validate({ params: idParams, body: updateTableBody }),
        controller.update
    );
    router.delete("/:id", requireRole("ADMIN"), validate({ params: idParams }), controller.remove);

    return router;
}

module.exports = { createTablesRouter };