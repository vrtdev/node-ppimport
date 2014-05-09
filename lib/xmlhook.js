var fs = require('fs');

exports.singleFileFunction = function (path, context, callback) {
    callback(null, fs.createReadStream(path));
};

exports.directoryFunction = function (path, archive, context, done) {
    archive.bulk([
        {
            expand: true,
            cwd: path,
            src: ['**/*.xml']
        }
    ]);
    done();
};