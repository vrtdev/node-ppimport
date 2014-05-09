var fs = require('fs');
var dust = require('dustjs-linkedin');
var Walker = require('walker');
var path = require('path');
var async = require('async');

function singleFileFunction(path, callback) {
    fs.readFile(path, {encoding: "UTF-8"}, function (error, data) {
        if (error) {
            callback(error);
        } else {
            compileAndAnswerWithStream(data, callback);
        }
    });
}
exports.singleFileFunction = singleFileFunction;

function compileAndAnswerWithStream(data, callback) {
    try {
        var compiled = dust.compile(data, "temp");
        dust.loadSource(compiled);
        callback(null, dust.stream("temp", {}));
    } catch (e) {
        callback(e);
    }
}

function directoryFunction(dirPath, archive, done) {
    var walker = Walker(dirPath);
    var functions = [];
    walker.on('entry', function (entry, stat) {
        if (path.extname(entry).toUpperCase() === '.DUST') {
            prepareFunctionForProcessingDustFile(functions, entry, archive);
        }
    }).on('end', createAsyncSeriesForProcessingFunctions(functions, done));
}
exports.directoryFunction = directoryFunction;

function prepareFunctionForProcessingDustFile(functions, entry, archive) {
    functions.push(function (callback) {
        fs.readFile(entry, {encoding: "UTF-8"}, function (error, data) {
            if (error) {
                callback(error);
            } else {
                processDustFile(data, callback, archive, entry);
            }
        });
    })
}

function processDustFile(data, callback, archive, entry) {
    try {
        dust.loadSource(dust.compile(data, "temp"));
        dust.render("temp", {}, function (error, out) {
            if (error) {
                callback(error);
            } else {
                archive.append(out, {name: entry});
                callback();
            }
        });
    } catch (error) {
        callback(error);
    }
}

function createAsyncSeriesForProcessingFunctions(functions, done) {
    return function () {
        async.series(functions, function (error, results) {
            if(error) {
                done(error);
            } else {
                done();
            }
        });
    }
}