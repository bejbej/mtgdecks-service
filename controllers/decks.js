module.exports = (app) => {
    const db = require("../db/db.js");
    const authenticateUser = require("../common/authenticateUser.js");

    app.get("/api/decks", async (request, response) => {
        let decks = await db.Deck.find({ owners: request.query.owner }, "_id name tags");
        response.status(200).json({results: decks});
    });

    app.post("/api/decks", authenticateUser, async (request, response) => {
        let deck = new db.Deck(request.body);
        deck.owners = [request.user];
        await deck.save();
        response.status(201).json({id: deck._id});
    });

    app.get("/api/decks/:id", async (request, response) => {
        let deck = await db.Deck.findById(request.params.id);
        deck ? response.status(200).json(deck) : response.status(404).end();
    });

    app.put("/api/decks/:id", authenticateUser, async (request, response) => {
        let result = await db.Deck.update({ _id:request.params.id, owners: [request.user] }, request.body);
        if (result.n === 1) {
            return response.status(204).end();
        }

        let count = await db.Deck.count({ _id:request.params.id });
        count === 0 ? response.status(401).end() : response.status(404).end();
    });

    app.delete("/api/decks/:id", authenticateUser, async (request, response) => {
        let commandResult = await db.Deck.remove({ _id: request.params.id, owners: request.user });
        if (commandResult.result.n === 1) {
            return response.status(204).end();
        }

        let count = await db.Deck.count({ _id:request.params.id });
        count === 0 ? response.status(404).end() : response.status(401).end();
    });
}