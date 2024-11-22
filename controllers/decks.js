module.exports = (app) => {
    const db = require("../db/db.js");
    const authenticateUser = require("../common/authenticateUser.js");

    app.get("/api/decks", async (request, response) => {
        const decks = await db.Deck.find({ owners: request.query.owner }, "_id name tags");
        response.status(200).json({results: decks});
    });

    app.post("/api/decks", authenticateUser, async (request, response) => {
        const deck = new db.Deck(request.body);
        deck.owners = [request.user];
        await deck.save();
        response.status(201).json({id: deck._id});
    });

    app.get("/api/decks/:id", async (request, response) => {
        const deck = await db.Deck.findById(request.params.id);
        deck ? response.status(200).json(deck) : response.status(404).end();
    });

    app.put("/api/decks/:id", authenticateUser, async (request, response) => {
        const result = await db.Deck.replaceOne({ _id:request.params.id, owners: [request.user] }, request.body);
        if (result.matchedCount === 1) {
            return response.status(204).end();
        }

        const deckId = await db.Deck.exists({ _id:request.params.id });
        deckId === null ? response.status(404).end() : response.status(401).end();
    });

    app.delete("/api/decks/:id", authenticateUser, async (request, response) => {
        const commandResult = await db.Deck.deleteOne({ _id: request.params.id, owners: request.user });
        if (commandResult.deletedCount === 1) {
            return response.status(204).end();
        }

        const deckId = await db.Deck.exists({ _id:request.params.id });
        deckId === null ? response.status(404).end() : response.status(401).end();
    });
}