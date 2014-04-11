var fs = require('fs');
var path = require('path');
var errors = require('./errors');
var Importer = require('./importer');
var dusthook = require('./dusthook');
var xmlhook = require('./xmlhook');

var polopolyOptions;

function getAbsolutePath(filePath) {
    var absolutePath;
    if (filePath.indexOf('/') != 0) {
        var callerDir = process.cwd();
        absolutePath = path.join(callerDir, filePath);
    } else {
        absolutePath = filePath;
    }
    return absolutePath;
}

function importContent(filePath, callback) {
    var absolutePath = getAbsolutePath(filePath);
    fs.stat(absolutePath, function (error, stats) {
        if (error) {
            callback(new errors.PathError('Invalid path', absolutePath));
        } else {
            polopolyOptions.absolutePath = absolutePath;
            polopolyOptions.stats = stats;
            polopolyOptions.callback = callback;
            new Importer(polopolyOptions).importFromAbsolutePath();
        }
    });
}

module.exports = function PPImport(options) {
    polopolyOptions = options || {polopolyUrl: 'http://localhost', username: 'admin', password: 'admin'};

    var hooks = polopolyOptions.hooks;
    if (!hooks) {
        hooks = [];
        polopolyOptions.hooks = hooks;
    }

    if (!hooks['.XML']) {
        hooks['.XML'] = xmlhook;
    }
    if (!hooks['.DUST']) {
        hooks['.DUST'] = dusthook;
    }

    return {
        importContent: importContent
    };
}

