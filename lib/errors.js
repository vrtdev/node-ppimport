var util = require('util');
function PathError(message, path) {
    var tmp = Error.apply(this, arguments);

    tmp.name = this.name = 'PathError';
    this.message = tmp.message;
    this.stack = tmp.stack;
    this.path = path;

    return this;
}
util.inherits(PathError, Error);

function FormatError() {
    var tmp = Error.apply(this, arguments);

    tmp.name = this.name = 'FormatError';
    this.message = tmp.message;
    this.stack = tmp.stack;

    return this;
}
util.inherits(FormatError, Error);

function HttpError(message, cause) {
    var tmp = Error.apply(this, arguments);

    tmp.name = this.name = 'HttpError';
    this.message = tmp.message;
    this.stack = tmp.stack;
    this.cause = cause;

    return this;
}
util.inherits(HttpError, Error);

function ArchiveError(message, cause) {
    var tmp = Error.apply(this, arguments);

    tmp.name = this.name = 'ArchiveError';
    this.message = tmp.message;
    this.stack = tmp.stack;
    this.cause = cause;

    return this;
}
util.inherits(ArchiveError, Error);

exports.PathError = PathError;
exports.FormatError = FormatError;
exports.HttpError = HttpError;
exports.ArchiveError = ArchiveError;