var errors = require('./errors');
var request = require('request');
var archiver = require('archiver');
var path = require('path');
var fs = require('fs');

var _absolutePath;
var _callback;
var _putRequest;
var _stats;
var _polopolyUrl;


function translateError(error, response, body) {
    var result = null;
    if (error) {
        result = new errors.HttpError('The request failed, see cause for more info', error);
    } else if (response.statusCode < 200 || response.statusCode >= 300) {
        result = new errors.HttpError('The request ended with errors: statusCode (' + response.statusCode + '), body: ' + body);
    }
    return result;
}


function importSingleFile() {
    if (path.extname(_absolutePath).toUpperCase() === '.XML') {
        fs.createReadStream(_absolutePath).pipe(_putRequest).on('error', function (error) {
            _callback(error);
        });
    } else {
        _callback(new errors.FormatError('Invalid format, only XML files are supported'));
    }
}
function importDirectory() {
    var archive = archiver('zip');
    archive.on('error', function (err) {
        var error = new errors.ArchiveError('Archiving failed, see cause for more info', err);
        _callback(error);
    });

    archive.pipe(_putRequest).on('error', function (error) {
        _callback(error);
    });
    archive.bulk([
        { expand: true, cwd: _absolutePath, src: ['**/*.xml'] }
    ]);
    archive.finalize();

}
function importFromAbsolutePath() {
    if (_stats.isDirectory()) {
        importDirectory();
    } else {
        importSingleFile();
    }
}
function Importer(absolutePath, options, stats, callback) {
    _stats = stats;
    _polopolyUrl = options.polopolyUrl + "?result=true&username=" + encodeURIComponent(options.username) + "&password=" + encodeURIComponent(options.password) + (_stats.isDirectory() ? '&type=jar' : '');
    _absolutePath = absolutePath;
    _callback = callback;
    _putRequest = request.defaults({headers: {'Content-Type': _stats.isDirectory() ? 'application/octet-stream' : 'text/xml'}}).put(_polopolyUrl, function (error, response, body) {
        var translatedError = translateError(error, response, body);
        if (translatedError) {
            _callback(translatedError);
        } else {
            _callback();
        }
    });
    return {
        importFromAbsolutePath: importFromAbsolutePath
    };
}

module.exports = Importer;
