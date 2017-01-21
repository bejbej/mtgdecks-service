var bodyParser = require("body-parser");
var cors = require("cors");
var express = require("express");
var models = require("./models.js");
var mongoose = require("mongoose");
var env = require('env2')('./env.json');

var app = express();
app.use(cors());
app.use(bodyParser.json());

if (process.env.https === true) {
    app.use((request, response, next) => {
        var protocol = request.get('x-forwarded-proto');
        protocol == 'https' ? next() : response.redirect('https://' + request.hostname + request.url);
    });
}

mongoose.connect(process.env.database);
var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
    console.log("Database connection ready");
    var server = app.listen(process.env.PORT || 8082, function () {
        var port = server.address().port;
        console.log("App now running on port", port);
    });
});

require("./controllers.js")(app, models(mongoose));
