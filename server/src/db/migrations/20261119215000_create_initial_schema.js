exports.up = async function (knex) {
  await knex.schema.createTable("users", table => {
    table.increments("id").primary();
    table.string("username", 50).notNullable().unique();
    table.string("password_hash", 255).notNullable();
    table.string("role", 20).notNullable().defaultTo("WAITER");
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("tables", table => {
    table.increments("id").primary();
    table.integer("number").notNullable().unique();
    table.integer("seats").notNullable();
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("menu_items", table => {
    table.increments("id").primary();
    table.string("name", 120).notNullable().unique();
    table.string("category", 50).notNullable();
    table.decimal("price", 10, 2).notNullable();
    table.boolean("is_available").notNullable().defaultTo(true);
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("orders", table => {
    table.increments("id").primary();
    table.integer("table_id").notNullable()
      .references("id").inTable("tables").onDelete("RESTRICT");
    table.integer("waiter_id").notNullable()
      .references("id").inTable("users").onDelete("RESTRICT");
    table.string("status", 20).notNullable().defaultTo("OPEN");
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp("closed_at", { useTz: true });
    table.index(["table_id", "status"]);
  });

  await knex.schema.createTable("order_items", table => {
    table.increments("id").primary();
    table.integer("order_id").notNullable()
      .references("id").inTable("orders").onDelete("CASCADE");
    table.integer("menu_item_id").notNullable()
      .references("id").inTable("menu_items").onDelete("RESTRICT");
    table.integer("quantity").notNullable();
    table.decimal("unit_price", 10, 2).notNullable();
    table.string("note", 255);
    table.index(["order_id"]);
  });

  await knex.raw(`ALTER TABLE users ADD CONSTRAINT users_role_check
    CHECK (role IN ('WAITER', 'ADMIN'))`);
  await knex.raw(`ALTER TABLE tables ADD CONSTRAINT tables_seats_check
    CHECK (seats > 0)`);
  await knex.raw(`ALTER TABLE menu_items ADD CONSTRAINT menu_items_price_check
    CHECK (price >= 0)`);
  await knex.raw(`ALTER TABLE orders ADD CONSTRAINT orders_status_check
    CHECK (status IN ('OPEN', 'IN_PREPARATION', 'SERVED', 'PAID', 'CANCELLED'))`);
  await knex.raw(`ALTER TABLE order_items ADD CONSTRAINT order_items_quantity_check
    CHECK (quantity > 0)`);
  await knex.raw(`CREATE UNIQUE INDEX orders_one_active_per_table
    ON orders (table_id)
    WHERE status IN ('OPEN', 'IN_PREPARATION', 'SERVED')`);
};

exports.down = async function (knex) {
  await knex.schema.dropTable("order_items");
  await knex.schema.dropTable("orders");
  await knex.schema.dropTable("menu_items");
  await knex.schema.dropTable("tables");
  await knex.schema.dropTable("users");
};