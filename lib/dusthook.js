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
            try {
                var compiled = dust.compile(data, "temp");
                dust.loadSource(compiled);
                callback(null, dust.stream("temp", {}));
            } catch (e) {
                callback(e);
            }
        }
    });
}
exports.singleFileFunction = singleFileFunction;

function directoryFunction(dirPath, archive, done) {
    var walker = Walker(dirPath);
    var functions = [];
    walker.on('entry', function (entry, stat) {
        if (path.extname(entry).toUpperCase() === '.DUST') {
            functions.push(function (callback) {
                fs.readFile(entry, {encoding: "UTF-8"}, function (error, data) {
                    if (error) {
                        callback(error);
                    } else {
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
                });
            })
        }
    }).on('end', function () {
        async.series(functions, function (error, results) {
            if(error) {
                done(error);
            } else {
                done();
            }
        });
    });
}
exports.directoryFunction = directoryFunction;