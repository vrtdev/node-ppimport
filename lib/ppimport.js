var util = require('util');
var fs = require('fs');
var path = require('path');

function PathError() {
    var tmp = Error.apply(this, arguments);

    tmp.name = this.name = 'PathError';
    this.message = tmp.message;
    this.stack = tmp.stack;

    return this;
}
util.inherits(PathError, Error);

function getAbsolutePath(filePath) {
    var absolutePath;
    if (filePath.indexOf('/') != 0) {
        var callerDir = path.dirname(module.parent.filename);
        absolutePath = path.join(callerDir, filePath);
    } else {
        absolutePath = filePath;
    }
    return absolutePath;
}

function importContent(filePath, callback) {
    var absolutePath = getAbsolutePath(filePath);
    fs.stat(absolutePath, function(error, stats) {
        if (error) {
            callback(new PathError('Invalid path'));
        } else {
            callback();
        }

    });

}

exports.importContent = importContent;
exports.PathError = PathError;