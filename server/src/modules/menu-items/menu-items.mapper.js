function toMenuItemResponse(item) {
    return {
        id: item.id,
        name: item.name,
        category: item.category,
        price: item.price,
        isAvailable: item.isAvailable,
        createdAt: new Date(item.createdAt).toISOString()
    };
}

module.exports = { toMenuItemResponse };