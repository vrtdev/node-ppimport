var chai = require("chai");
var expect = chai.expect;
var errors = require('../lib/errors');


describe('errors', function () {
    describe(' - PathError', function () {
        var error;
        beforeEach(function () {
            error = new errors.PathError();
        });

        it('should actually be an instance of PathError', function () {
            expect(error).to.be.an.instanceOf(errors.PathError);
        });

        it('should be inheriting from Error', function () {
            expect(error).to.be.an.instanceOf(Error);
        });

        it('should have message as specified in it\'s constructor', function () {
            error = new errors.PathError('message');
            expect(error.message).to.be.equal('message');
        });

        it('should be named PathError', function () {
            expect(error.name).to.be.equal('PathError');
        });

        it('should have a stack trace', function () {
            expect(error.stack).to.not.be.null;
        });

        it('should have a stack trace containing a reference to this test', function () {
            expect(error.stack).to.have.a.string(__filename);
        });

        it('should have a path as given in the constructor', function () {
            error = new errors.PathError('message', 'path');
            expect(error.path).to.be.equal('path');
        });
    });

    describe(' - HttpError', function () {
        it('should print a stack containing the cause');
    });
});