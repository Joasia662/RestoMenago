function toTableResponse(table) {
    return {
        id: table.id,
        number: table.number,
        seats: table.seats,
        createdAt: new Date(table.createdAt).toISOString()
    };
}

module.exports = { toTableResponse };