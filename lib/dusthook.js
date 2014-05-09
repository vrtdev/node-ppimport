var fs = require('fs');
var dust = require('dustjs-linkedin');
var Walker = require('walker');
var path = require('path');
var async = require('async');

function singleFileFunction(path, context, callback) {
    fs.readFile(path, {encoding: "UTF-8"}, function (error, data) {
        if (error) {
            callback(error);
        } else {
            compileAndAnswerWithStream(data, context, callback);
        }
    });
}
exports.singleFileFunction = singleFileFunction;

function compileAndAnswerWithStream(data, context, callback) {
    try {
        var compiled = dust.compile(data, "temp");
        dust.loadSource(compiled);
        callback(null, dust.stream("temp", context));
    } catch (e) {
        callback(e);
    }
}

function directoryFunction(dirPath, archive, context, done) {
    var walker = Walker(dirPath);
    var functions = [];
    walker.on('entry', function (entry, stat) {
        if (path.extname(entry).toUpperCase() === '.DUST') {
            prepareFunctionForProcessingDustFile(functions, entry, archive, context);
        }
    }).on('end', createAsyncSeriesForProcessingFunctions(functions, done));
}
exports.directoryFunction = directoryFunction;

function prepareFunctionForProcessingDustFile(functions, entry, archive, context) {
    functions.push(function (callback) {
        fs.readFile(entry, {encoding: "UTF-8"}, function (error, data) {
            if (error) {
                callback(error);
            } else {
                processDustFile(data, callback, archive, entry, context);
            }
        });
    })
}

function processDustFile(data, callback, archive, entry, context) {
    try {
        dust.loadSource(dust.compile(data, "temp"));
        dust.render("temp", context, function (error, out) {
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