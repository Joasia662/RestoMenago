const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { UnauthorizedError, NotFoundError } = require("../../errors/AppError");

function createAuthService({ usersRepository, jwtSecret, jwtExpiresIn }) {
    return {
        async login({ username, password }) {
            const user = await usersRepository.findByUsername(username);

            // same error for unknown user and wrong password - do not reveal which one was wrong
            const passwordOk = user ? await bcrypt.compare(password, user.passwordHash) : false;
            if (!passwordOk) {
                throw new UnauthorizedError("Invalid username or password");
            }

            const token = jwt.sign(
                { sub: String(user.id), username: user.username, role: user.role },
                jwtSecret,
                { expiresIn: jwtExpiresIn }
            );

            return { token, user };
        },

        async getCurrentUser(id) {
            const user = await usersRepository.findById(id);
            if (!user) throw new NotFoundError("User");
            return user;
        }
    };
}

module.exports = { createAuthService };