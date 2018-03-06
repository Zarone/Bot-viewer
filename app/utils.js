exports.stringToObject = function (string) {
    var object = exports.parseJSON('{"' + string.replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}');
    return object;
};

exports.parseJSON = function (string) {
    try {
        return JSON.parse(string);
    } catch (err) {
        return null;
    }
};