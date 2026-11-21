// Run before the server starts in Docker: create/update the schema
// and load the demo data only when the database is still empty,
// so restarting the container never wipes real data.
const db = require("./knex");

async function prepare() {
    await db.migrate.latest();
    console.log("[db] migrations are up to date");

    const [{ count }] = await db("users").count();
    if (Number(count) === 0) {
        await db.seed.run();
        console.log("[db] empty database: demo data loaded");
    }
}

prepare()
    .then(() => db.destroy())
    .catch(async err => {
        console.error("[db] preparation failed:", err.message);
        await db.destroy();
        process.exit(1);
    });
