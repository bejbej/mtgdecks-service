module.exports = (app) => {
    const http = require("request-promise");
    const jwt = require("jwt-simple");
    const moment = require("moment");
    const db = require("../db/db.js");

    const accessTokenUrl = "https://www.googleapis.com/oauth2/v4/token";
    const tokenInfoUrl = "https://www.googleapis.com/oauth2/v1/tokeninfo";

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
            grant_type: "authorization_code"
        };

        let accessToken = JSON.parse(await http.post(accessTokenUrl, { form: params }));
        let tokenInfo = JSON.parse(await http.post(tokenInfoUrl, { form: { access_token: accessToken.access_token } }));
        let user = await db.User.findOne({ google: tokenInfo.user_id });
        
        if (user) {
            response.status(200).json({ token: createJWT(user) });
            return;
        }
        
        let match = /(.{2})([^@]+)([^@]{2}@.*)/.exec(tokenInfo.email);
        let name = match[1] + match[2].replace(/./g, "*") + match[3];

        user = new db.User();
        user.name = name;
        user.google = tokenInfo.user_id
        await user.save();
        response.status(200).json({ token: createJWT(user) });
    });
}