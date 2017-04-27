var bodyParser = require("body-parser");
var cors = require("cors");
var express = require("express");
var env = require('env2')('./env.json');
var db = require("./db/db.js");
var controllers = require("./controllers/controllers.js");

var app = express();
app.use(cors());
app.use(bodyParser.json());
controllers(app);

if (process.env.https === true) {
    app.use((request, response, next) => {
        var protocol = request.get('x-forwarded-proto');
        protocol == 'https' ? next() : response.redirect('https://' + request.hostname + request.url);
    });
}

db.init(process.env.database).then(() => {
    console.log("Database connection ready");
    var server = app.listen(process.env.PORT || 8082, function () {
        var port = server.address().port;
        console.log("App now running on port", port);
    });
}, () => {
    console.log("Database connection error");
});
