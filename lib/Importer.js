var errors = require('./errors');
var request = require('request');
var archiver = require('archiver');
var path = require('path');
var fs = require('fs');
var dust = require('dustjs-linkedin');
var walker = require('walker');
var async = require('async');

var _absolutePath;
var _callback;
var _stats;
var _polopolyUrl;


function Importer(absolutePath, options, stats, callback) {
    _stats = stats;
    _polopolyUrl = options.polopolyUrl + "?result=true&username=" + encodeURIComponent(options.username) + "&password=" + encodeURIComponent(options.password) + (_stats.isDirectory() ? '&type=jar' : '');
    _absolutePath = absolutePath;
    _callback = callback;
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

function importFromAbsolutePath() {
    if (_stats.isDirectory()) {
        importDirectory();
    } else {
        importSingleFile();
    }
}
Importer.prototype.importFromAbsolutePath = importFromAbsolutePath;

function importDirectory() {
    var archive = archiver('zip');
    archive.on('error', function (err) {
        var error = new errors.ArchiveError('Archiving failed, see cause for more info', err);
        _callback(error);
    });

    archive.pipe(doPut()).on('error', function (error) {
        _callback(error);
    });
    archive.bulk([
        { expand: true, cwd: _absolutePath, src: ['**/*.xml'], hook: function () {
        } }
    ]);


    var archiving = 0;
    walker(_absolutePath).on('entry', function (entry, stat) {
        if (path.extname(entry).toUpperCase() === '.DUST') {
            archiving++;
            fs.readFile(entry, {encoding: "UTF-8"}, function (error, data) {
                if (error) {
                    _callback(error);
                } else {
                    dust.loadSource(dust.compile(data, "temp"));
                    dust.render("temp", {}, function (err, out) {
                        archiving--;
                        if (err) {
                            _callback(err);
                        } else {
                            archive.append(out, {name: entry});
                        }
                    });
                }
            });

        }
    }).on('end', function () {
        async.whilst(function () {
            return archiving > 0;
        }, function (callback) {
            setTimeout(callback, 1);
        }, function () {
            archive.finalize();
        })
    });


}

function importSingleFile() {
    var extension = path.extname(_absolutePath).toUpperCase();
    if (extension === '.XML') {
        fs.createReadStream(_absolutePath).pipe(doPut()).on('error', function (error) {
            _callback(error);
        });
    } else if (extension === '.DUST') {
        fs.readFile(_absolutePath, {encoding: "UTF-8"}, function (error, data) {
            if (error) {
                _callback(error);
            } else {
                dust.loadSource(dust.compile(data, "temp"));
                dust.stream("temp", {}).pipe(doPut());
            }
        });
    } else {
        _callback(new errors.FormatError('Invalid format, only XML files are supported'));
    }
}

module.exports = Importer;
