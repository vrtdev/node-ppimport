var errors = require('./errors');
var request = require('request');
var archiver = require('archiver');
var path = require('path');
var fs = require('fs');
var async = require('async');

var _absolutePath;
var _callback;
var _stats;
var _polopolyUrl;
var _hooks;


function Importer(spec) {
    _stats = spec.stats;
    _polopolyUrl = spec.polopolyUrl + "?result=true&username=" + encodeURIComponent(spec.username) + "&password=" + encodeURIComponent(spec.password) + (_stats.isDirectory() ? '&type=jar' : '');
    _absolutePath = spec.absolutePath;
    _callback = spec.callback;
    _hooks = spec.hooks || {};
}

function doPut() {
    return request.defaults({headers: {'Content-Type': _stats.isDirectory() ? 'application/octet-stream' : 'text/xml'}}).put(_polopolyUrl, putRequestCallback);
}

function putRequestCallback(error, response, body) {
    var translatedError = translateError(error, response, body);
    if (translatedError) {
        _callback(translatedError);
    } else {
        _callback(null, body);
    }
}

function translateError(error, response, body) {
    var result = null;
    if (error) {
        result = new errors.HttpError('The request failed, see cause for more info', error);
    } else if (response.statusCode < 200 || response.statusCode >= 300) {
        result = new errors.HttpError('The request ended with errors: statusCode (' + response.statusCode + '), body: ' + body);
    }
    return result;
}

function importFromAbsolutePath(context) {
    if (_stats.isDirectory()) {
        importDirectory(context);
    } else {
        importSingleFile(context);
    }
}
Importer.prototype.importFromAbsolutePath = importFromAbsolutePath;

function importDirectory(context) {
    var archive = archiver('zip');
    archive.on('error', function (err) {
        var error = new errors.ArchiveError('Archiving failed, see cause for more info', err);
        _callback(error);
    });

    archive.pipe(doPut()).on('error', function (error) {
        _callback(error);
    });

    async.series(scheduleHookDirectoryFunctions(archive, context), function (error, results) {
        archive.finalize();
    });
}

function scheduleHookDirectoryFunctions(archive, context) {
    var dirFunctions = [];
    for (var mappedExtension in _hooks) {
        var hookFn = _hooks[mappedExtension].directoryFunction;
        if (hookFn) {
            scheduleHook(hookFn, dirFunctions, archive, context);
        }
    }
    return dirFunctions;
}

function scheduleHook(hookFn, fnArray, archive, context) {
    fnArray.push(function (callback) {
        hookFn(_absolutePath, archive, context, function (error) {
            if (error) {
                callback(error);
            } else {
                callback();
            }
        });
    });
}

function importSingleFile(context) {
    var extension = path.extname(_absolutePath).toUpperCase();

    if (_hooks[extension]) {
        pipeHookStreamToPut(extension, context);
    } else {
        _callback(new errors.FormatError('Invalid format, only ' + Object.keys(_hooks) + ' files are supported'));
    }
}

function pipeHookStreamToPut(extension, context) {
    var hookFn = _hooks[extension].singleFileFunction;
    hookFn(_absolutePath, context, function (error, stream) {
        if (error) {
            _callback(error);
        } else if (!stream || !stream.pipe) {
            _callback(new TypeError('Your hook method for ' + extension + ' files does not return a valid stream object.'));
        } else {
            stream.pipe(doPut()).on('error', function (error) {
                _callback(error);
            });
        }
    });
}

module.exports = Importer;
