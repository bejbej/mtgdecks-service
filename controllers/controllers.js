module.exports = function() {
    
    let init = (app) => {
        app.get("/api/cat", (request, response) => {
            response.status(200).json({ cat: "~(=^..^)" });
        });

        app.get("/api/error", (request, response) => {
            throw { message: "~(=^..^)", stack: " ~(=^..^)\n  ~(=^..^)\n   ~(=^..^)"};
        });
    
        require("./cards.js")(app);
        require("./decks.js")(app);
        require("./auth.js")(app);
        require("./users.js")(app);
    }

    return {
        init: init
    }
}();