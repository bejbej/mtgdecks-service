module.exports = () => {

    const express = require("express")();

    let call = (func, request, response, next) => {
        Promise.resolve().then(async () => {
            try {
                await func(request, response, next);
            }
            catch (error) {
                console.log(error.message);
                console.log(error.stack);
                response.status(500).end();
            }
        });
    }

    let wrap = (action) => {
        return function () {
            let newArguments = [arguments[0]];
            for (let i = 1; i < arguments.length; ++i) {
                let callback = arguments[i];
                newArguments.push((request, response, next) => call(callback, request, response, next));
            }

            express[action].apply(express, newArguments);
        }
    }

    return {
        get: wrap("get"),
        post: wrap("post"),
        put: wrap("put"),
        delete: wrap("delete"),
        use: (...args) => express.use(...args),
        listen: (...args) => express.listen(...args)
    }
}