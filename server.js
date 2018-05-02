require("express-async-errors");
var bodyParser = require("body-parser");
var controllers = require("./controllers/controllers.js");
var cors = require("cors");
var db = require("./db/db.js");
var env = require('env2')('./env.json');
var express = require("express");

var app = express();
app.use(cors());
app.use(bodyParser.json());

controllers.init(app);

app.use((error, request, response, next) => {
    console.log(error.message);
    console.log(error.stack);
    response.status(500).end();
});

if (process.env.https === true) {
    app.use((request, response, next) => {
        var protocol = request.get('x-forwarded-proto');
        protocol == 'https' ? next() : response.redirect('https://' + request.hostname + request.url);
    });
}

(async () => {
    try {
        await db.init(process.env.database);
        console.log("Database connection ready");
    }
    catch (error) {
        console.log(error.message);
        process.exit(0);
    }
    let server = app.listen(process.env.PORT || 8082, () => {
        let port = server.address().port;
        console.log("App now running on port", port);
    });
})();
