function toUser(row) {
    return {
        id: row.id,
        username: row.username,
        passwordHash: row.password_hash,
        role: row.role,
        createdAt: row.created_at
    };
}

function createUsersRepository(db) {
    return {
        async findById(id) {
            const row = await db("users").where({ id }).first(); 
            return row ? toUser(row) : null; //Service zamówień sprawdza nim, czy kelner o podanym ID istnieje
        }
    };
}

module.exports = { createUsersRepository };