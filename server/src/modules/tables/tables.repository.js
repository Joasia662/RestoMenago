function toTable(row) {
    return {
        id: row.id,
        number: row.number,
        seats: row.seats,
        createdAt: row.created_at
    };
}

function createTablesRepository(db) {
    return {
        async list() {
            const rows = await db("tables").orderBy("number");
            return rows.map(toTable);
        },

        async findById(id) {
            const row = await db("tables").where({ id }).first();
            return row ? toTable(row) : null;
        },

        async findByNumber(number) {
            const row = await db("tables").where({ number }).first();
            return row ? toTable(row) : null;
        },

        async create({ number, seats }) {
            const [row] = await db("tables").insert({ number, seats }).returning("*");
            return toTable(row);
        },

        async update(id, changes) {
            const [row] = await db("tables").where({ id }).update(changes).returning("*");
            return row ? toTable(row) : null;
        },

        async remove(id) {
            const deleted = await db("tables").where({ id }).del();
            return deleted > 0;
        }
    };
}

module.exports = { createTablesRepository };