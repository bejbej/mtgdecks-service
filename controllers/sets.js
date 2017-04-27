module.exports = (app) => {
    var db = require("../db/db.js");
    var handleError = require("../common/handleError.js");

    app.get("/api/sets", (request, response) => {
        db.Set.find().then(sets => {
            response.status(200).json(sets);
        }, error => {
            handleError(response, error.message, "Failed to get sets.");
        });
    });
}