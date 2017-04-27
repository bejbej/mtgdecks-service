module.exports = (app) => {
    var db = require("../db/db.js");
    var handleError = require("../common/handleError.js");
    var authenticateUser = require("../common/authenticateUser.js");

    app.post("/api/users/me", authenticateUser, (request, response) => {
        db.User.findById(request.user, "_id").then(user => {
            response.status(200).json(user);
        }, error => {
            handleError(response, error.message, "Failed to get user.");
        });
    });
}