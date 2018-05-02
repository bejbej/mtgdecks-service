module.exports = function (expirationMs) {

    let cache = {};

    this.get = (key, func) => {
        let item = cache[key];
        let now = new Date().getTime();

        if (item !== undefined) {
            if (item.modifiedOn + expirationMs > now) {
                return item.value;
            }

            delete cache[key];
        }

        let value = func();
        cache[key] = { value: value, modifiedOn: now };
        return value;
    }
};