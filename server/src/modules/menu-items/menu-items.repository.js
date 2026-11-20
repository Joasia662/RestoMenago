function toMenuItem(row) {
    return {
        id: row.id,
        name: row.name,
        category: row.category,
        price: Number(row.price),
        isAvailable: row.is_available,
        createdAt: row.created_at
    };
}

function toRow(changes) {
    const row = {};
    if (changes.name !== undefined) row.name = changes.name;
    if (changes.category !== undefined) row.category = changes.category;
    if (changes.price !== undefined) row.price = changes.price;
    if (changes.isAvailable !== undefined) row.is_available = changes.isAvailable;
    return row;
}

function createMenuItemsRepository(db) {
    return {
        async list({ category, available, search, page, pageSize }) {
            const query = db("menu_items");

            if (category) query.where({ category });
            if (available !== undefined) query.where({ is_available: available });
            if (search) query.whereILike("name", `%${search}%`);

            const [{ count }] = await query.clone().count();
            const rows = await query
                .orderBy("name")
                .limit(pageSize)
                .offset((page - 1) * pageSize);

            return { items: rows.map(toMenuItem), total: Number(count) };
        },

        async findById(id) {
            const row = await db("menu_items").where({ id }).first();
            return row ? toMenuItem(row) : null;
        },

        async findByName(name) {
            const row = await db("menu_items").where({ name }).first();
            return row ? toMenuItem(row) : null;
        },

        async create(input) {
            const [row] = await db("menu_items").insert(toRow(input)).returning("*");
            return toMenuItem(row);
        },

        async update(id, changes) {
            const [row] = await db("menu_items")
                .where({ id })
                .update(toRow(changes))
                .returning("*");
            return row ? toMenuItem(row) : null;
        },

        async remove(id) {
            const deleted = await db("menu_items").where({ id }).del();
            return deleted > 0;
        }
    };
}

module.exports = { createMenuItemsRepository };