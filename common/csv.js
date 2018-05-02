module.exports = function () {
    let parse = (csv, delimeter) => {
        delimeter = delimeter || ",";
        let lines = csv.split("\n");
        let keys = lines.shift().split(delimeter);
        return lines.reduce((array, line) => {
            if (line.trim().length === 0) {
                return array;
            }
            let values = line.split(delimeter);
            let item = {};
            for (let i = 0; i < keys.length; ++i) {
                item[keys[i]] = values[i];
            }
            array.push(item);
            return array;
        }, []);
    }

    return {
        parse: parse
    };
}();