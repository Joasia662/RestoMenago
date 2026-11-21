const { NotFoundError, ConflictError, UnsupportedMediaTypeError } = require("../../errors/AppError");

// allowed image types and the first bytes every such file starts with,
// so a renamed .exe sent as "image/png" is rejected
const IMAGE_SIGNATURES = {
    "image/png": data => data.subarray(0, 4).toString("hex") === "89504e47",
    "image/jpeg": data => data.subarray(0, 3).toString("hex") === "ffd8ff",
    "image/webp": data =>
        data.subarray(0, 4).toString("ascii") === "RIFF" && data.subarray(8, 12).toString("ascii") === "WEBP"
};

function createMenuItemsService({ menuItemsRepository, ordersRepository, now = () => new Date() }) {
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
        },

        async setMenuItemImage(id, { data, mimeType }) {
            await getMenuItem(id);

            const type = (mimeType || "").split(";")[0].trim().toLowerCase();
            const matchesType = IMAGE_SIGNATURES[type];
            if (!Buffer.isBuffer(data) || data.length === 0 || !matchesType || !matchesType(data)) {
                throw new UnsupportedMediaTypeError("Send a PNG, JPEG or WEBP image");
            }

            return menuItemsRepository.setImage(id, { data, mime: type, updatedAt: now() });
        },

        async removeMenuItemImage(id) {
            await getMenuItem(id);
            return menuItemsRepository.setImage(id, { data: null, mime: null, updatedAt: null });
        },

        async getMenuItemImage(id) {
            const image = await menuItemsRepository.findImage(id);
            if (!image) throw new NotFoundError("Image");
            return image;
        }
    };
}

module.exports = { createMenuItemsService };