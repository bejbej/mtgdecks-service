module.exports = (app, schema) => {
    var cardUpdater = require("./cardUpdater.js");
    var http = require("request-promise");
    var jwt = require("jwt-simple");
    var moment = require("moment");

    var handleError = (response, reason, message, code) => {
        console.log("ERROR: " + reason);
        response.status(code || 500).json({ "error": message });
    }

    var ensureAuthenticated = (request, response, next) => {
        if (!request.header('Authorization')) {
            return response.status(401).send({ message: 'Please make sure your request has an Authorization header' });
        }

        var token = request.header('Authorization').split(' ')[1];

        var payload = null;
        try {
            payload = jwt.decode(token, process.env.tokenSecret);
        }
        catch (error) {
            handleError(response, error.message, "Failed to authenticate", 401);
        }

        if (payload.exp <= moment().unix()) {
            handleError(response, error.message, "Token is expired", 401);
        }

        request.user = payload.sub;
        next();
    }

    app.get("/api/cat", (request, response) => {
        response.status(200).json({ cat: "~(=^..^)" });
    });

    app.get("/api/decks", (request, response) => {
        schema.Deck.find({ owners: request.query.owner }, "_id name").then(decks => {
            response.status(200).json({ results: decks });
        }, error => {
            handleError(response, error.message, "Failed to find decks.");
        });
    });

    app.post("/api/decks", ensureAuthenticated, (request, response) => {
        var deck = new schema.Deck(request.body);
        deck.owners = [request.user];
        deck.save().then(() => {
            response.status(201).json({ id: deck._id });
        }, error => {
            handleError(response, error.message, "Failed to save deck.");
        });
    });

    app.get("/api/decks/:id", (request, response) => {
        schema.Deck.findById(request.params.id).then(deck => {
            if (deck) {
                response.status(200).json(deck);
            } else {
                response.status(404).end();
            }
        }, error => {
            handleError(response, error.message, "Failed to get deck.");
        });
    });

    app.put("/api/decks/:id", ensureAuthenticated, (request, response) => {
        schema.Deck.update({ _id:request.params.id, owners: [request.user] }, request.body).then(result => {
            if (result.result.n === 1) {
                response.status(204).end();
            } else {
                schema.Deck.count({ _id:request.params.id }).then(result => {
                    if (result > 0) {
                        response.status(401).end();
                    } else {
                        response.status(404).end();
                    }
                }, error => {
                    handleError(response, error.message, "Failed to update deck.");
                });
            }
        }, error => {
            handleError(response, error.message, "Failed to update deck.");
        });
    });

    app.delete("/api/decks/:id", ensureAuthenticated, (request, response) => {
        schema.Deck.remove({ _id: request.params.id, owners: request.user }).then(result => {
            if (result.result.n === 1) {
                response.status(204).end();
            } else {
                schema.Deck.count({ _id:request.params.id }).then(result => {
                    if (result > 0) {
                        response.status(401).end();
                    } else {
                        response.status(404).end();
                    }
                }, error => {
                    handleError(response, error.message, "Failed to update deck.");
                });
            }
        }, error => {
            handleError(response, error.message, "Failed to delete deck.");
        });
    });

    app.get("/api/cards", (request, response) => {
        schema.Card.find({ name: { $in: request.query.name } }).then(cards => {
            response.status(200).json(cards);
        }, error => {
            handleError(response, error.message, "Failed to get cards.");
        })
    });

    app.get("/update", (request, response) => {
        new cardUpdater(schema).exec(request.query.limit).then(message => {
            console.log("Added " + message + " sets.");
            response.status(404).end()
        }, error => {
            console.log(error);
            response.status(404).end();
        });
    });

    app.post("/api/users/me", ensureAuthenticated, (request, response) => {
        schema.User.findById(request.user, "_id").then(user => {
            response.status(200).json(user);
        }, error => {
            handleError(response, error.message, "Failed to get user.");
        });
    });

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
                schema.User.findOne({ google: res.sub }).then(user => {
                    if (user) {
                        response.status(200).json({ token: createJWT(user) })
                    } else {
                        var user = new schema.User();
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
