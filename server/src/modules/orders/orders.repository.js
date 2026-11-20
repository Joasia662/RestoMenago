function createOrdersRepository(db) {
    return {
        async countByTable(tableId) {
            const [{ count }] = await db("orders").where({ table_id: tableId }).count();
            return Number(count);
        },

        async countItemsByMenuItem(menuItemId) {
            const [{ count }] = await db("order_items")
                .where({ menu_item_id: menuItemId })
                .count();
            return Number(count);
        }
    };
}

module.exports = { createOrdersRepository };