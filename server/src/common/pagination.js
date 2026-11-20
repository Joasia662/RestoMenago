function toPageResponse({ items, total }, { page, pageSize }, mapItem) {
    return {
        data: items.map(mapItem),
        pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize)
        }
    };
}

module.exports = { toPageResponse };