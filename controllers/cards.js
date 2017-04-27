module.exports = (app) => {
    var db = require("../db/db.js");
    var handleError = require("../common/handleError.js");
    var update = require("../common/cardUpdater.js");
    var queryUtilities = require("../common/queryUtilities.js");

    app.get("/api/cards", (request, response) => {
        db.Card.find({ name: { $in: request.query.name } }).then(cards => {
            response.status(200).json(cards);
        }, error => {
            handleError(response, error.message, "Failed to get cards.");
        })
    });

    app.get("/api/cards/update", (request, response) => {
        update.exec(request.query.limit).then(n => {
            console.log("Added " + n + " sets");
            response.status(201).end();
        }, error => {
            console.log(error);
            response.status(500).end();
        });
    });
}