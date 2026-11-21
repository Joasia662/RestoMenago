const config = require("./config");
const db = require("./db/knex");
const { createApp } = require("./app");
const { createUnitOfWork } = require("./db/unitOfWork");

if (!config.jwtSecret) {
  console.error("JWT_SECRET is missing. Add it to server/.env (see .env.example).");
  process.exit(1);
}

const { repositories, runInTransaction } = createUnitOfWork(db);
const app = createApp({ db, repositories, runInTransaction, config });

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});