var util = require('util');
var fs = require('fs');
var path = require('path');
var request = require('request');

//var _polopolyBaseUrl;

function PathError() {
    var tmp = Error.apply(this, arguments);

    tmp.name = this.name = 'PathError';
    this.message = tmp.message;
    this.stack = tmp.stack;

    return this;
}
util.inherits(PathError, Error);

function FormatError() {
    var tmp = Error.apply(this, arguments);

    tmp.name = this.name = 'FormatError';
    this.message = tmp.message;
    this.stack = tmp.stack;

    return this;
}
util.inherits(FormatError, Error);

function HttpError(message, cause) {
    var tmp = Error.apply(this, arguments);

    tmp.name = this.name = 'HttpError';
    this.message = tmp.message;
    this.stack = tmp.stack;
    this.cause = cause;

    return this;
}
util.inherits(HttpError, Error);


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

function translateError(error, response, body) {
    var result = null;
    if (error) {
        result = new HttpError('The request failed, see cause for more info', error);
    } else if (response.statusCode < 200 || response.statusCode >= 300) {
        result = new HttpError('The request ended with errors: statusCode (' + response.statusCode + '), body: ' + body);
    }
    return result;
}

function importSingleFile(absolutePath, callback) {
    if (path.extname(absolutePath).toUpperCase() === '.XML') {
        fs.createReadStream(absolutePath).pipe(request.defaults({headers: {'Content-Type': 'text/xml'}}).put(_polopolyBaseUrl, function (error, response, body) {
            var translatedError = translateError(error, response, body);
            if (translatedError) {
                callback(translatedError);
            } else {
                callback();
            }
        })).on('error', function(error) {
            callback(error);
        });
    } else {
        callback(new FormatError('Invalid format, only XML files are supported'));
    }
}
function importContent(filePath, callback) {
    var absolutePath = getAbsolutePath(filePath);
    fs.stat(absolutePath, function(error, stats) {
        if (error) {
            callback(new PathError('Invalid path'));
        } else {
            importSingleFile(absolutePath, callback);
        }

    });

}

module.exports = function importContentConst(polopolyBaseUrl) {
    _polopolyBaseUrl = polopolyBaseUrl || 'http://localhost';

    return {
        importContent: importContent,
        PathError: PathError,
        FormatError: FormatError,
        HttpError: HttpError
    };
}

