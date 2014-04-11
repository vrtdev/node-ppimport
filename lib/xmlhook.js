var fs = require('fs');

exports.singleFileFunction = function (path, callback) {
        callback(null, fs.createReadStream(path));
    };

exports.directoryFunction = function (path, archive, done) {
    archive.bulk([
        {
            expand: true,
            cwd: path,
            src: ['**/*.xml']
        }
    ]);
    done();
};