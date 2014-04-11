var chai = require('chai');
var expect = chai.expect;
var dusthook = require('../lib/dusthook');
var sinon = require('sinon');

describe('dust hook for ppimport', function () {
    describe('single file function', function () {
        it('should result in an error when file was not found', function (done) {
            dusthook.singleFileFunction(process.cwd() + '/test/dust/non-existing-file', function (err) {
                expect(err).to.be.instanceOf(Error);
                expect(err.code).to.be.equal('ENOENT');
                done();
            });
        });
        it('should result in an error when file does not compile (is an invalid dust file)', function (done) {
            dusthook.singleFileFunction(process.cwd() + '/test/dust/wrong.dust', function (err) {
                expect(err).to.be.instanceOf(Error);
                done();
            });
        });
        it('should result in a dust stream when the dust file is found and compiles just fine', function (done) {
            dusthook.singleFileFunction(process.cwd() + '/test/dust/ok/ok.dust', function (err, stream) {
                expect(err).to.be.null;
                expect(stream.pipe).to.not.be.undifined;
                done();
            });
        });
    });

    describe('entire directory function', function () {
        var archive;
        var walker = require('walker');
        it('should finish after walking the directory tree', function (done) {
            dusthook.directoryFunction(process.cwd() + '/test/dust/ok', archive, function () {
                expect(archive.appendCalls).to.be.equal(2);
                done();
            })
        });

        it('should finish with error when at least one dust file is invalid', function (done) {
            dusthook.directoryFunction(process.cwd() + '/test/dust/wrong', archive, function (error) {
                expect(archive.appendCalls).to.be.equal(0);
                expect(error).to.be.instanceOf(Error);
                done();
            })
        });

        beforeEach(function() {
            archive = {appendCalls: 0, append:function() {  this.appendCalls++; }};
        });
    });
});