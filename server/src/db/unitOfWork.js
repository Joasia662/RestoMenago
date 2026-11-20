const { createTablesRepository } = require("../modules/tables/tables.repository");
//const { createMenuItemsRepository } = require("../modules/menu-items/menu-items.repository");
const { createOrdersRepository } = require("../modules/orders/orders.repository");

// conn is either the knex instance (pool) or a transaction object
function createRepositories(conn) {
    return {
        tables: createTablesRepository(conn),
        //menuItems: createMenuItemsRepository(conn),
        orders: createOrdersRepository(conn)
    };
}

function createUnitOfWork(db) {
    return {
        repositories: createRepositories(db),

        // fn receives repositories bound to one transaction:
        // everything inside is committed together or rolled back together
        runInTransaction(fn) {
            return db.transaction(trx => fn(createRepositories(trx)));
        }
    };
}

module.exports = { createUnitOfWork };