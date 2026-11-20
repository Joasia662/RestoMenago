const { NotFoundError, ConflictError } = require("../../errors/AppError");

function createTablesService({ tablesRepository, ordersRepository }) {
    async function getTable(id) {
        const table = await tablesRepository.findById(id);
        if (!table) throw new NotFoundError("Table");
        return table;
    }

    return {
        listTables() {
            return tablesRepository.list();
        },

        getTable,

        async createTable(input) {
            const existing = await tablesRepository.findByNumber(input.number);
            if (existing) {
                throw new ConflictError("Table number is already used", "TABLE_NUMBER_TAKEN");
            }
            return tablesRepository.create(input);
        },

        async updateTable(id, changes) {
            await getTable(id);

            if (changes.number !== undefined) {
                const existing = await tablesRepository.findByNumber(changes.number);
                if (existing && existing.id !== id) {
                    throw new ConflictError("Table number is already used", "TABLE_NUMBER_TAKEN");
                }
            }

            return tablesRepository.update(id, changes);
        },

        async deleteTable(id) {
            await getTable(id);

            const ordersCount = await ordersRepository.countByTable(id);
            if (ordersCount > 0) {
                throw new ConflictError("Table has orders and cannot be deleted", "TABLE_HAS_ORDERS");
            }

            await tablesRepository.remove(id);
        }
    };
}

module.exports = { createTablesService };