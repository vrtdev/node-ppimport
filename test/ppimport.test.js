var chai = require("chai");
var expect = chai.expect;
var should = chai.should();
var ppimport = require("../lib/ppimport");

describe('ppimport', function () {
    describe.only('import file', function () {
        it('should result in a PathError when passing an invalid path', function (done) {
            var path = "non-existing-file";
            ppimport.importContent(path, function(error) {
                expect(error).to.be.a.instanceOf(ppimport.PathError);
                expect(error.message).to.be.a.string('Invalid path');
                done();
            });
        });

        it('should not result in an error when passing a path to an existing file', function (done) {
            var path = "./simple-existing-file";
            ppimport.importContent(path, function(error) {
                expect(error).to.be.undefined;
                done();
            });
        });

        it('should result in a FormatError when passing an invalid file format', function (done) {

        });
    });


    describe('import directory', function () {
        it('should take a directory as parameter', function () {

        });
    });


    //Test just to be sure if we created the custom error appropriately
    describe('PathError', function () {
        var error;
        beforeEach(function(){
            error = new ppimport.PathError();
        });

        it('should have PathError which is actually an instance of PathError', function () {
            expect(error).to.be.an.instanceOf(ppimport.PathError);
        });

        it('should be inheriting from Error', function() {
            expect(error).to.be.an.instanceOf(Error);
        });

        it('should have message as specified in it\'s constructor', function() {
            error = new ppimport.PathError('message');
            expect(error.message).to.be.equal('message');
        });

        it('should be named PathError', function() {
            expect(error.name).to.be.equal('PathError');
        });

        it('should have a stack trace', function() {
            expect(error.stack).to.not.be.null;
        });

        it('should have a stack trace containing a reference to this test', function() {
            expect(error.stack).to.have.a.string(__filename);
        });
    });
});