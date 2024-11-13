require('env2')('./env.json');
var bodyParser = require("body-parser");
var controllers = require("./controllers/controllers.js");
var cors = require("cors");
var db = require("./db/db.js");
const App = require("./common/app.js");

var app = App();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.text({type: "application/text"}));

controllers.init(app);

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
