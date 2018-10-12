Array.flatten = function(array) {
    return Array.prototype.concat.apply([], array);
}

Array.except = function(array1, array2, keyFunc) {
    keyFunc = keyFunc || (x => x);
    let dictionary = {};
    array1.forEach(item => dictionary[keyFunc(item)] = item);
    array2.forEach(item => delete dictionary[keyFunc(item)]);
    return Object.keys(dictionary).map(key => dictionary[key]);
}

Array.split = function(array, splitSize) {
    let result = [];
    for (let i = 0; i < array.length; ++i) {
        result.push(array.slice(i, i + splitSize));
    }
    return result;
}