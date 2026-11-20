const { toTableResponse } = require("./tables.mapper");

function createTablesController(tablesService) {
    return {
        async list(req, res) {
            const tables = await tablesService.listTables();
            res.json(tables.map(toTableResponse));
        },

        async getById(req, res) {
            const table = await tablesService.getTable(req.validated.params.id);
            res.json(toTableResponse(table));
        },

        async create(req, res) {
            const table = await tablesService.createTable(req.validated.body);
            res
                .status(201)
                .location(`/api/tables/${table.id}`)
                .json(toTableResponse(table));
        },

        async update(req, res) {
            const table = await tablesService.updateTable(
                req.validated.params.id,
                req.validated.body
            );
            res.json(toTableResponse(table));
        },

        async remove(req, res) {
            await tablesService.deleteTable(req.validated.params.id);
            res.status(204).end();
        }
    };
}

module.exports = { createTablesController };