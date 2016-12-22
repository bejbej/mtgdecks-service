module.exports = (app, schema) => {
    var cardUpdater = require("./cardUpdater.js");

    var handleError = (response, reason, message, code) => {
        console.log("ERROR: " + reason);
        response.status(code || 500).json({ "error": message });
    }

    app.get("/api/cat", (request, response) => {
        response.status(200).json({ cat: "~(=^..^)" });
    });

    app.get("/api/decks", (request, response) => {
        schema.Deck.find({}, "_id name").then(decks => {
            response.status(200).json({ results: decks });
        }, error => {
            handleError(response, error.message, "Failed to find decks.");
        });
    });

    app.post("/api/decks", (request, response) => {
        var deck = new schema.Deck(request.body);
        deck.save().then(() => {
            response.status(201).json({ id: deck._id });
        }, error => {
            handleError(response, error.message, "Failed to save deck.");
        });
    });

    app.get("/api/decks/:id", (request, response) => {
        schema.Deck.findById(request.params.id).then(deck => {
            response.status(200).json(deck);
        }, error => {
            handleError(response, error.message, "Failed to get deck.");
        });
    });

    app.put("/api/decks/:id", (request, response) => {
        schema.Deck.findByIdAndUpdate(request.params.id, request.body).then(() => {
            response.status(204).end();
        }, error => {
            handleError(response, error.message, "Failed to update deck.");
        });
    });

    app.delete("/api/decks/:id", (request, response) => {
        schema.Deck.findByIdAndRemove(request.params.id).then(() => {
            response.status(204).end();
        }, error => {
            handleError(response, error.message, "Failed to update deck.");
        });
    });

    app.get("/api/cards", (request, response) => {
        schema.Card.find({ name: { $in: request.query.name } }).then(cards => {
            response.status(200).json(cards);
        }, error => {
            handleError(response, error.message, "Failed to get cards.");
        })
    });

    app.get("/update", (request, response) => {
        new cardUpdater(schema).exec(request.query.limit).then(message => {
            console.log("Added " + message + " sets.");
            response.status(404).end()
        }, error => {
            console.log(error);
            response.status(404).end();
        });
    });
}
