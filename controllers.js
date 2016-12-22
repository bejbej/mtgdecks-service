module.exports = function controllers(app, schema) {
    var cardUpdater = require("./cardUpdater.js");

    var handleError = function (response, reason, message, code) {
        console.log("ERROR: " + reason);
        response.status(code || 500).json({ "error": message });
    }

    app.get("/api/cat", function (request, response) {
        response.status(200).json({ cat: "~(=^..^)" });
    });

    app.get("/api/decks", function (request, response) {
        schema.Deck.find({}, "_id name", function (error, decks) {
            if (error) {
                handleError(response, error.message, "Failed to find decks.");
            } else {
                response.status(200).json({ results: decks });
            }
        });
    });

    app.post("/api/decks", function (request, response) {
        var deck = new schema.Deck(request.body);
        deck.save(function (error) {
            if (error) {
                handleError(response, error.message, "Failed to save deck.");
            } else {
                response.status(201).json({ id: deck._id });
            }
        });
    });

    app.get("/api/decks/:id", function (request, response) {
        schema.Deck.findById(request.params.id, function (error, deck) {
            if (error) {
                handleError(response, error.message, "Failed to get deck.");
            } else {
                response.status(200).json(deck);
            }
        })
    });

    app.put("/api/decks/:id", function (request, response) {
        schema.Deck.findByIdAndUpdate(request.params.id, request.body, function (error) {
            if (error) {
                handleError(response, error.message, "Failed to update deck.");
            } else {
                response.status(204).end();
            }
        });
    });

    app.delete("/api/decks/:id", function (request, response) {
        schema.Deck.findByIdAndRemove(request.params.id, function (error) {
            if (error) {
                handleError(response, error.message, "Failed to update deck.");
            } else {
                response.status(204).end();
            }
        });
    });

    app.get("/api/cards", function (request, response) {
        schema.Card.find({ name: { $in: request.query.name } }).then(cards => {
            response.status(200).json(cards);
        }, error => {
            handleError(response, error.message, "Failed to get cards.");
        })
    });

    app.get("/updateCards", function (request, response) {
        new cardUpdater(schema).exec().then(message => {
            response.status(204).end();
        }, error => {
            handleError(response, error.message, "~(=^..^)");
        });
    });
}
