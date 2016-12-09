var express = require("express");
var bodyParser = require("body-parser");
var cors = require("cors");
var mongoose = require("mongoose");
var models = require("./models.js");

var app = express();
app.use(cors());
app.use(bodyParser.json());

mongoose.connect(process.env.database);
var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
    console.log("Database connection ready");
    var server = app.listen(process.env.PORT || 8080, function () {
        var port = server.address().port;
        console.log("App now running on port", port);
    });
});

var Deck = models(mongoose).Deck;

var handleError = function (response, reason, message, code) {
    console.log("ERROR: " + reason);
    response.status(code || 500).json({ "error": message });
}

app.get("/api/cat", function (request, response) {
    response.status(200).json({ cat: "~(=^..^)" });
});

app.get("/api/decks", function (request, response) {
    Deck.find({}, "_id name", function (error, decks) {
        if (error) {
            handleError(response, error.message, "Failed to find decks.");
        } else {
            response.status(200).json({ results: decks });
        }
    });
});

app.post("/api/decks", function (request, response) {
    var deck = new Deck(request.body);
    deck.save(function (error) {
        if (error) {
            handleError(response, error.message, "Failed to save deck.");
        } else {
            response.status(201).json({ id: deck._id });
        }
    });
});

app.get("/api/decks/:id", function (request, response) {
    Deck.findById(request.params.id, function (error, deck) {
        if (error) {
            handleError(response, error.message, "Failed to get deck.");
        } else {
            response.status(200).json(deck);
        }
    })
});

app.put("/api/decks/:id", function (request, response) {
    Deck.findByIdAndUpdate(request.params.id, request.body, function (error) {
        if (error) {
            handleError(response, error.message, "Failed to update deck.");
        } else {
            response.status(204).end();
        }
    });
});

app.delete("/api/decks/:id", function (request, response) {
    Deck.findByIdAndRemove(request.params.id, function (error) {
        if (error) {
            handleError(response, error.message, "Failed to update deck.");
        } else {
            response.status(204).end();
        }
    });
});