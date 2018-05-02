module.exports = (request, response, next) => {
    var jwt = require("jwt-simple");
    var moment = require("moment");

    if (!request.header('Authorization')) {
        return response.status(401).send({ message: 'Please make sure your request has an Authorization header' });
    }

    var token = request.header('Authorization').split(' ')[1];

    var payload = null;
    try {
        payload = jwt.decode(token, process.env.tokenSecret);
    }
    catch (error) {
        response.status(401).end();
    }

    if (payload.exp <= moment().unix()) {
        response.status(401).end();
    }

    request.user = payload.sub;
    next();
}