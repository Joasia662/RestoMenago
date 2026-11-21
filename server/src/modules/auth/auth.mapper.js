function toUserResponse(user) {
    return {
        id: user.id,
        username: user.username,
        role: user.role
    };
}

module.exports = { toUserResponse };