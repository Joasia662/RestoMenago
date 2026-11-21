function toMenuItemResponse(item) {
    return {
        id: item.id,
        name: item.name,
        category: item.category,
        price: item.price,
        isAvailable: item.isAvailable,
        createdAt: new Date(item.createdAt).toISOString(),
        // ?v= changes after every upload, so the browser never shows an old cached photo
        imageUrl: item.imageUpdatedAt
            ? `/api/menu-items/${item.id}/image?v=${new Date(item.imageUpdatedAt).getTime()}`
            : null
    };
}

module.exports = { toMenuItemResponse };