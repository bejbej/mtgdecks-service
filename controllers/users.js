module.exports = (app) => {
    const db = require("../db/db.js");
    const authenticateUser = require("../common/authenticateUser.js");

    app.post("/api/users/me", authenticateUser, async (request, response) => {
        let user = await db.User.findById(request.user, "_id");
        response.status(200).json(user);
    });
}