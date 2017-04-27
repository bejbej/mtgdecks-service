module.exports = function () {

    var createCaseInsensitiveQuery = (values) => {
        var values = values instanceof Array ? values : [values];
        return values.map(value => {
            return new RegExp("^" + value + "$", "i");
        });
    }

    return {
        createCaseInsensitiveQuery: createCaseInsensitiveQuery
    }
}();
