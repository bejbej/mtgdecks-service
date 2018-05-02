module.exports = (app) => {
    const http = require("request-promise");
    const jwt = require("jwt-simple");
    const moment = require("moment");
    const db = require("../db/db.js");

    const accessTokenUrl = 'https://accounts.google.com/o/oauth2/token';
    const peopleApiUrl = 'https://www.googleapis.com/plus/v1/people/me/openIdConnect';

    let createJWT = (user) => {
        var payload = {
            sub: user._id,
            iat: moment().unix(),
            exp: moment().add(14, 'days').unix()
        };
        return jwt.encode(payload, process.env.tokenSecret);
    }

    app.post("/api/auth/google", async (request, response) => {
        var params = {
            code: request.body.code,
            client_id: request.body.clientId,
            client_secret: process.env.googleSecret,
            redirect_uri: request.body.redirectUri,
            grant_type: 'authorization_code'
        };

        let postResponse = await http.post(accessTokenUrl, { form: params, json: true });
        let accessToken = postResponse.access_token;
        let headers = { Authorization: 'Bearer ' + accessToken };

        let googleUser = await http.get({ url: peopleApiUrl, headers: headers, json: true });
        let user = await db.User.findOne({ google: googleUser.sub });

        if (user) {
            response.status(200).json({ token: createJWT(user) });
            return;
        }

        user = new db.User();
        user.name = googleUser.name;
        user.google = googleUser.sub;
        await user.save();
        response.status(200).json({ token: createJWT(user) });
    });
}