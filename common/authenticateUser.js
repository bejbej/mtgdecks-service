module.exports = (request, response, next) => {
    var jwt = require("jwt-simple");
    var moment = require("moment");
    var handleError = require("./handleError.js");

    if (!request.header('Authorization')) {
        return response.status(401).send({ message: 'Please make sure your request has an Authorization header' });
    }

    var token = request.header('Authorization').split(' ')[1];

    var payload = null;
    try {
        payload = jwt.decode(token, process.env.tokenSecret);
    }
    catch (error) {
        return handleError(response, error.message, "Failed to authenticate", 401);
    }

    if (payload.exp <= moment().unix()) {
        return handleError(response, error.message, "Token is expired", 401);
    }

    request.user = payload.sub;
    next();
}