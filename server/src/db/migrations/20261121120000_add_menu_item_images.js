// Dish photos are stored in the database (bytea), so they work the same
// locally and in Docker and are part of the database backup.
exports.up = async function (knex) {
    await knex.schema.alterTable("menu_items", table => {
        table.binary("image_data");
        table.string("image_mime", 50);
        table.timestamp("image_updated_at", { useTz: true });
    });
};

exports.down = async function (knex) {
    await knex.schema.alterTable("menu_items", table => {
        table.dropColumn("image_data");
        table.dropColumn("image_mime");
        table.dropColumn("image_updated_at");
    });
};
