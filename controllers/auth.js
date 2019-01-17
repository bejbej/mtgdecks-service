module.exports = (app) => {
    const http = require("request-promise");
    const jwt = require("jwt-simple");
    const moment = require("moment");
    const db = require("../db/db.js");

    const accessTokenUrl = 'https://www.googleapis.com/oauth2/v1/tokeninfo';

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
            access_token: request.body.access_token
        };
        let responseString = await http.post(accessTokenUrl, { form: params });
        let googleUser = JSON.parse(responseString);
        let user = await db.User.findOne({ google: googleUser.user_id });

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