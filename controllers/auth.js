module.exports = (app) => {
    var http = require("request-promise");
    var jwt = require("jwt-simple");
    var moment = require("moment");
    var db = require("../db/db.js");
    var handleError = require("../common/handleError.js");

    app.post("/api/auth/google", (request, response) => {
        var accessTokenUrl = 'https://accounts.google.com/o/oauth2/token';
        var peopleApiUrl = 'https://www.googleapis.com/plus/v1/people/me/openIdConnect';
        var params = {
            code: request.body.code,
            client_id: request.body.clientId,
            client_secret: process.env.googleSecret,
            redirect_uri: request.body.redirectUri,
            grant_type: 'authorization_code'
        };

        var createJWT = (user) => {
            var payload = {
                sub: user._id,
                iat: moment().unix(),
                exp: moment().add(14, 'days').unix()
            };
            return jwt.encode(payload, process.env.tokenSecret);
        }

        http.post(accessTokenUrl, { form: params, json: true }).then(res => {
            var accessToken = res.access_token;
            var headers = { Authorization: 'Bearer ' + accessToken };

            http.get({ url: peopleApiUrl, headers: headers, json: true }).then(res => {
                db.User.findOne({ google: res.sub }).then(user => {
                    if (user) {
                        response.status(200).json({ token: createJWT(user) })
                    } else {
                        var user = new db.User();
                        user.name = res.name;
                        user.google = res.sub;
                        user.save().then(() => {
                            response.status(200).json({ token: createJWT(user) })
                        }, error => {
                            handleError(response, error.message, "Failed to save user.");
                        });
                    }
                }, error => {
                    handleError(response, error.message, "Failed to get user.");
                });

            }, error => {
                handleError(reponse, error.message, "Failed to get person.");
            });

        }, error => {
            handleError(response, error.message, "Failed to get access token.");
        });
    });
}