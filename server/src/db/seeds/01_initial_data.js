
const bcrypt = require("bcryptjs");

exports.seed = async function (knex) {
  await knex.raw(
    "TRUNCATE order_items, orders, menu_items, tables, users RESTART IDENTITY CASCADE"
  );


  await knex("users").insert([
    { username: "manager", password_hash: bcrypt.hashSync("manager123", 10), role: "ADMIN" },
    { username: "anna", password_hash: bcrypt.hashSync("anna123", 10), role: "WAITER" },
    { username: "piotr", password_hash: bcrypt.hashSync("piotr123", 10), role: "WAITER" }
  ]);

  await knex("tables").insert([
    { number: 1, seats: 2 },
    { number: 2, seats: 2 },
    { number: 3, seats: 4 },
    { number: 4, seats: 4 },
    { number: 5, seats: 6 }
  ]);

  await knex("menu_items").insert([
    { name: "Zupa pomidorowa", category: "SOUP", price: 14.0 },
    { name: "Pierogi ruskie", category: "MAIN", price: 28.0 },
    { name: "Schabowy", category: "MAIN", price: 36.5 },
    { name: "Sałatka cezar", category: "MAIN", price: 31.0 },
    { name: "Sernik", category: "DESSERT", price: 17.0 },
    { name: "Lemoniada", category: "DRINK", price: 12.0 },
    { name: "Zupa dnia", category: "MAIN", price: 42.0, is_available: false }
  ]);

  await knex("orders").insert([
    { table_id: 3, waiter_id: 2, status: "OPEN" },
    { table_id: 1, waiter_id: 3, status: "PAID", closed_at: knex.fn.now() }
  ]);

  await knex("order_items").insert([
    { order_id: 1, menu_item_id: 1, quantity: 2, unit_price: 14.0 },
    { order_id: 1, menu_item_id: 2, quantity: 1, unit_price: 28.0, note: "Bez cebuli" },
    { order_id: 2, menu_item_id: 5, quantity: 2, unit_price: 17.0 }
  ]);
};