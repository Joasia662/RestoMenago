exports.seed = async function (knex) {
  await knex.raw(
    "TRUNCATE order_items, orders, menu_items, tables, users RESTART IDENTITY CASCADE"
  );

  // password_hash is a placeholder - real hashes are added together with login
  await knex("users").insert([
    { username: "manager", password_hash: "not-set", role: "ADMIN" },
    { username: "anna", password_hash: "not-set", role: "WAITER" },
    { username: "piotr", password_hash: "not-set", role: "WAITER" }
  ]);

  await knex("tables").insert([
    { number: 1, seats: 2 },
    { number: 2, seats: 2 },
    { number: 3, seats: 4 },
    { number: 4, seats: 4 },
    { number: 5, seats: 6 }
  ]);

  await knex("menu_items").insert([
    { name: "Tomato soup", category: "SOUP", price: 14.0 },
    { name: "Pierogi ruskie", category: "MAIN", price: 28.0 },
    { name: "Pork chop with potatoes", category: "MAIN", price: 36.5 },
    { name: "Caesar salad", category: "MAIN", price: 31.0 },
    { name: "Cheesecake", category: "DESSERT", price: 17.0 },
    { name: "Lemonade", category: "DRINK", price: 12.0 },
    { name: "Seasonal special", category: "MAIN", price: 42.0, is_available: false }
  ]);

  await knex("orders").insert([
    { table_id: 3, waiter_id: 2, status: "OPEN" },
    { table_id: 1, waiter_id: 3, status: "PAID", closed_at: knex.fn.now() }
  ]);

  await knex("order_items").insert([
    { order_id: 1, menu_item_id: 1, quantity: 2, unit_price: 14.0 },
    { order_id: 1, menu_item_id: 2, quantity: 1, unit_price: 28.0, note: "no onion" },
    { order_id: 2, menu_item_id: 5, quantity: 2, unit_price: 17.0 }
  ]);
};