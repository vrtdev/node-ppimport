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

/**
 * Import polopoly content from the given path
 *
 * @param {String} path string to be escaped
 * @param {Object} [context] context information that can be used when generating the XML files to import, especially useful in conjunction with a templating engines.
 * @param {Function} callback called when importing is done. The callback is called with an error argument when something fails. When the import succeeded, no arguments are given.
 * @api public
 */
function importContent() {
    var filePath, context, callback;
    filePath = arguments[0];
    callback = arguments[arguments.length - 1];
    if (arguments.length == 2) {
        context = {};
    } else {
        context = arguments[1];
    }

    var absolutePath = getAbsolutePath(filePath);
    fs.stat(absolutePath, function (error, stats) {
        if (error) {
            callback(new errors.PathError('Invalid path', absolutePath));
        } else {
            polopolyOptions.absolutePath = absolutePath;
            polopolyOptions.stats = stats;
            polopolyOptions.callback = callback;
            new Importer(polopolyOptions).importFromAbsolutePath(context);
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

