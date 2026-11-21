const { Router } = require("express");
const validate = require("../../middleware/validate");
const { idParams } = require("../../common/schemas");
const {
    createOrderBody,
    orderItemBody,
    updateOrderItemBody,
    changeStatusBody,
    listOrdersQuery,
    orderItemParams
} = require("./orders.schemas");

function createOrdersRouter(controller) {
    const router = Router();

    router.get("/", validate({ query: listOrdersQuery }), controller.list);
    router.get("/:id", validate({ params: idParams }), controller.getById);
    router.post("/", validate({ body: createOrderBody }), controller.create);

    router.patch(
        "/:id/status",
        validate({ params: idParams, body: changeStatusBody }),
        controller.changeStatus
    );

    router.post(
        "/:id/items",
        validate({ params: idParams, body: orderItemBody }),
        controller.addItem
    );
    router.patch(
        "/:id/items/:itemId",
        validate({ params: orderItemParams, body: updateOrderItemBody }),
        controller.updateItem
    );
    router.delete(
        "/:id/items/:itemId",
        validate({ params: orderItemParams }),
        controller.removeItem
    );

    return router;
}

module.exports = { createOrdersRouter };