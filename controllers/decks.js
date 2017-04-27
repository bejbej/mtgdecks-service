module.exports = (app) => {
    var db = require("../db/db.js");
    var authenticateUser = require("../common/authenticateUser.js");
    var handleError = require("../common/handleError.js");

    app.get("/api/decks", (request, response) => {
        db.Deck.find({ owners: request.query.owner }, "_id name").then(decks => {
            response.status(200).json({ results: decks });
        }, error => {
            handleError(response, error.message, "Failed to find decks.");
        });
    });

    app.post("/api/decks", authenticateUser, (request, response) => {
        var deck = new db.Deck(request.body);
        deck.owners = [request.user];
        deck.save().then(() => {
            response.status(201).json({ id: deck._id });
        }, error => {
            handleError(response, error.message, "Failed to save deck.");
        });
    });

    app.get("/api/decks/:id", (request, response) => {
        db.Deck.findById(request.params.id).then(deck => {
            if (deck) {
                response.status(200).json(deck);
            } else {
                response.status(404).end();
            }
        }, error => {
            handleError(response, error.message, "Failed to get deck.");
        });
    });

    app.put("/api/decks/:id", authenticateUser, (request, response) => {
        db.Deck.update({ _id:request.params.id, owners: [request.user] }, request.body).then(result => {
            if (result.result.n === 1) {
                response.status(204).end();
            } else {
                db.Deck.count({ _id:request.params.id }).then(result => {
                    if (result > 0) {
                        response.status(401).end();
                    } else {
                        response.status(404).end();
                    }
                }, error => {
                    handleError(response, error.message, "Failed to update deck.");
                });
            }
        }, error => {
            handleError(response, error.message, "Failed to update deck.");
        });
    });

    app.delete("/api/decks/:id", authenticateUser, (request, response) => {
        db.Deck.remove({ _id: request.params.id, owners: request.user }).then(result => {
            if (result.result.n === 1) {
                response.status(204).end();
            } else {
                db.Deck.count({ _id:request.params.id }).then(result => {
                    if (result > 0) {
                        response.status(401).end();
                    } else {
                        response.status(404).end();
                    }
                }, error => {
                    handleError(response, error.message, "Failed to update deck.");
                });
            }
        }, error => {
            handleError(response, error.message, "Failed to delete deck.");
        });
    });
}