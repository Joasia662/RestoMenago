const { NotFoundError, ConflictError } = require("../../errors/AppError");

function createMenuItemsService({ menuItemsRepository, ordersRepository }) {
    async function getMenuItem(id) {
        const item = await menuItemsRepository.findById(id);
        if (!item) throw new NotFoundError("Menu item");
        return item;
    }

    async function assertNameIsFree(name, ignoreId) {
        const existing = await menuItemsRepository.findByName(name);
        if (existing && existing.id !== ignoreId) {
            throw new ConflictError("Menu item name is already used", "MENU_ITEM_NAME_TAKEN");
        }
    }

    return {
        listMenuItems(filters) {
            return menuItemsRepository.list(filters);
        },

        getMenuItem,

        async createMenuItem(input) {
            await assertNameIsFree(input.name);
            return menuItemsRepository.create(input);
        },

        async updateMenuItem(id, changes) {
            await getMenuItem(id);
            if (changes.name !== undefined) await assertNameIsFree(changes.name, id);
            return menuItemsRepository.update(id, changes);
        },

        async deleteMenuItem(id) {
            await getMenuItem(id);

            const usages = await ordersRepository.countItemsByMenuItem(id);
            if (usages > 0) {
                throw new ConflictError(
                    "Menu item was already ordered. Mark it as unavailable instead.",
                    "MENU_ITEM_IN_USE"
                );
            }

            await menuItemsRepository.remove(id);
        }
    };
}

module.exports = { createMenuItemsService };