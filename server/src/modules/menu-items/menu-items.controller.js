const { toMenuItemResponse } = require("./menu-items.mapper");
const { toPageResponse } = require("../../common/pagination");

function createMenuItemsController(menuItemsService) {
    return {
        async list(req, res) {
            const query = req.validated.query;
            const result = await menuItemsService.listMenuItems(query);
            res.json(toPageResponse(result, query, toMenuItemResponse));
        },

        async getById(req, res) {
            const item = await menuItemsService.getMenuItem(req.validated.params.id);
            res.json(toMenuItemResponse(item));
        },

        async create(req, res) {
            const item = await menuItemsService.createMenuItem(req.validated.body);
            res
                .status(201)
                .location(`/api/menu-items/${item.id}`)
                .json(toMenuItemResponse(item));
        },

        async update(req, res) {
            const item = await menuItemsService.updateMenuItem(
                req.validated.params.id,
                req.validated.body
            );
            res.json(toMenuItemResponse(item));
        },

        async remove(req, res) {
            await menuItemsService.deleteMenuItem(req.validated.params.id);
            res.status(204).end();
        },

        async uploadImage(req, res) {
            const item = await menuItemsService.setMenuItemImage(req.validated.params.id, {
                data: req.body, // Buffer from express.raw()
                mimeType: req.get("Content-Type")
            });
            res.json(toMenuItemResponse(item));
        },

        async removeImage(req, res) {
            const item = await menuItemsService.removeMenuItemImage(req.validated.params.id);
            res.json(toMenuItemResponse(item));
        },

        async getImage(req, res) {
            const image = await menuItemsService.getMenuItemImage(req.validated.params.id);
            res.set("Content-Type", image.mime);
            res.set("Cache-Control", "public, max-age=86400");
            res.send(image.data);
        }
    };
}

module.exports = { createMenuItemsController };