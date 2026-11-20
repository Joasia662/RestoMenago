const { Router } = require("express");
const validate = require("../../middleware/validate");
const { idParams } = require("../../common/schemas");
const { createTableBody, updateTableBody } = require("./tables.schemas");

function createTablesRouter(controller) {
    const router = Router();

    router.get("/", controller.list);
    router.get("/:id", validate({ params: idParams }), controller.getById);
    router.post("/", validate({ body: createTableBody }), controller.create);
    router.patch(
        "/:id",
        validate({ params: idParams, body: updateTableBody }),
        controller.update
    );
    router.delete("/:id", validate({ params: idParams }), controller.remove);

    return router;
}

module.exports = { createTablesRouter };