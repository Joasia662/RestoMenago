const config = require("./config");
const db = require("./db/knex");
const { createApp } = require("./app");

const app = createApp({ db });

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});