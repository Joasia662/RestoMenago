const config = require("./config");
const { createApp } = require("./app");

const app = createApp();

app.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`);
});