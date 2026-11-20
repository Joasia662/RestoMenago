const config = require("./config");
const db = require("./db/knex");
const { createApp } = require("./app");
const { createUnitOfWork } = require("./db/unitOfWork");

const { repositories, runInTransaction } = createUnitOfWork(db);
const app = createApp({ db, repositories, runInTransaction });

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});