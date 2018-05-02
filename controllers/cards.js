module.exports = (app) => {
    const cardService = require("../common/cardService.js");

    app.post("/api/cards", async (request, response) => {
        let cardNames = request.body.split("\n").map(cardName => cardName.trim());
        let cards = await cardService.get(cardNames);
        let csv = "name\tusd\n" + cards.map(card => card.name + "\t" + card.usd).join("\n");
        response.status(200).send(csv);
    });
}