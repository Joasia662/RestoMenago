const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { createMenuItemsService } = require("../../src/modules/menu-items/menu-items.service");

const PNG = Buffer.from("89504e470d0a1a0a0000000d49484452", "hex");

function createFakes() {
    const saved = [];
    const menuItemsRepository = {
        findById: async id => ({ id, name: "Zupa pomidorowa", isAvailable: true }),
        setImage: async (id, image) => {
            saved.push({ id, ...image });
            return { id, imageMime: image.mime };
        }
    };
    const service = createMenuItemsService({ menuItemsRepository, ordersRepository: {}, now: () => new Date(0) });
    return { service, saved };
}

describe("menu-items.service images", () => {
    test("accepts a real PNG file", async () => {
        const { service, saved } = createFakes();

        await service.setMenuItemImage(1, { data: PNG, mimeType: "image/png" });

        assert.equal(saved.length, 1);
        assert.equal(saved[0].mime, "image/png");
    });

    test("rejects a file whose content does not match its type", async () => {
        const { service, saved } = createFakes();
        const notAnImage = Buffer.from("MZ this is not a picture");

        await assert.rejects(
            service.setMenuItemImage(1, { data: notAnImage, mimeType: "image/png" }),
            err => err.statusCode === 415 && err.code === "UNSUPPORTED_IMAGE"
        );
        assert.equal(saved.length, 0);
    });
});
