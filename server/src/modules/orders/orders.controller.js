const { toOrderSummaryResponse, toOrderResponse } = require("./orders.mapper");
const { toPageResponse } = require("../../common/pagination");

function createOrdersController(ordersService) {
    return {
        async list(req, res) {
            const query = req.validated.query;
            const result = await ordersService.listOrders(query);
            res.json(toPageResponse(result, query, toOrderSummaryResponse));
        },

        async getById(req, res) {
            const order = await ordersService.getOrder(req.validated.params.id);
            res.json(toOrderResponse(order));
        },

        async create(req, res) {
            const order = await ordersService.createOrder(req.validated.body);
            res.status(201).location(`/api/orders/${order.id}`).json(toOrderResponse(order));
        },

        async changeStatus(req, res) {
            const order = await ordersService.changeStatus(
                req.validated.params.id,
                req.validated.body.status
            );
            res.json(toOrderResponse(order));
        },

        async addItem(req, res) {
            const order = await ordersService.addItem(req.validated.params.id, req.validated.body);
            res.status(201).json(toOrderResponse(order));
        },

        async updateItem(req, res) {
            const { id, itemId } = req.validated.params;
            const order = await ordersService.updateItem(id, itemId, req.validated.body);
            res.json(toOrderResponse(order));
        },

        async removeItem(req, res) {
            const { id, itemId } = req.validated.params;
            const order = await ordersService.removeItem(id, itemId);
            res.json(toOrderResponse(order));
        }
    };
}

module.exports = { createOrdersController };