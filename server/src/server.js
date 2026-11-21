const config = require("./config");
const db = require("./db/knex");
const { createApp } = require("./app");
const { createUnitOfWork } = require("./db/unitOfWork");
const { createEventBus } = require("./events/eventBus");
const { registerOrderListeners } = require("./events/orderListeners");

if (!config.jwtSecret) {
  console.error("JWT_SECRET is missing. Add it to server/.env (see .env.example).");
  process.exit(1);
}

const { repositories, runInTransaction } = createUnitOfWork(db);
const events = createEventBus();
registerOrderListeners(events);

const app = createApp({ db, repositories, runInTransaction, config, events });

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});