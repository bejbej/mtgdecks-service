module.exports = (app) => {
    app.get("/api/cat", (request, response) => {
        response.status(200).json({ cat: "~(=^..^)" });
    });

    require("./decks.js")(app);
    require("./auth.js")(app);
    require("./cards.js")(app);
    require("./users.js")(app);
    require("./sets.js")(app);
}
