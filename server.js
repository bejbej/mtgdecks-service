var bodyParser = require("body-parser");
var cors = require("cors");
var express = require("express");
var models = require("./models.js");
var mongoose = require("mongoose");

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

require("./controllers.js")(app, models(mongoose));
