var chai = require("chai");
var expect = chai.expect;
var should = chai.should();
var ppimport = require("../lib/ppimport")('http://test.url');
var sinon = require('sinon');
var request = require('request');
var fs = require('fs');
var events = require('events');

describe('ppimport', function () {
    describe('import file', function () {
        var requestStub;
        var fsStub;
        function Stream() {
            this.pipe = function() {return this};
            events.EventEmitter.call(this);
        };
        var stream;
        Stream.prototype.__proto__ = events.EventEmitter.prototype;

        beforeEach(function () {
            stream = new Stream();
            fsStub = sinon.stub(fs, 'createReadStream').returns(stream);
            requestStub = sinon.stub(request, 'put');
        });

        afterEach(function () {
            request.put.restore();
            fsStub.restore();
        });

        it('should result in a PathError when passing an invalid path', function (done) {
            var path = "non-existing-file";
            ppimport.importContent(path, function (error) {
                expect(error).to.be.an.instanceOf(ppimport.PathError);
                expect(error.message).to.be.a.string('Invalid path');
                done();
            });
        });

        it('should not result in an error when passing a path to an existing file', function (done) {
            var path = "./FunnY.XmL";
            requestStub.yields(null, {statusCode: 200}, null);
            ppimport.importContent(path, function (error) {
                expect(error).to.be.undefined;
                done();
            });
        });

        it('should result in a FormatError when passing a path to a file which is not an XML file', function (done) {
            var path = "simple-existing-file";
            ppimport.importContent(path, function (error) {
                expect(error).to.be.an.instanceOf(ppimport.FormatError);
                expect(error.message).to.be.a.string('Invalid format, only XML files are supported');
                done();
            });
        });

        it('should send the XML file to polopoly via HTTP communication', function (done) {
            var path = "./file.xml";
            requestStub.yields(null, {statusCode: 200}, null);
            ppimport.importContent(path, function (error) {
                expect(requestStub.withArgs('http://test.url').calledOnce).to.be.ok;
                done();
            });
        });

        it('should send the XML file to localhost when no url is given to the constructor.', function (done) {
            var path = "./file.xml";
            var defaultPpImport = require('../lib/ppimport')();
            requestStub.yields(null, {statusCode: 200}, null);
            defaultPpImport.importContent(path, function () {
                expect(requestStub.getCall(0).args[0]).to.be.string('http://localhost');
                done();
            });
        });

        it('should result in a HttpError when the server returns a status code not in 200 range', function (done) {
            var path = "./file.xml";
            requestStub.yields(null, {statusCode: 500}, "body");
            ppimport.importContent(path, function (error) {
                expect(error).to.be.an.instanceOf(ppimport.HttpError);
                expect(error.message).to.be.a.string('The request ended with errors: statusCode (500), body: body');
                done();
            });
        });

        it('should not result in an Error when the server returns a status code in 200 range', function (done) {
            var path = "./file.xml";
            requestStub.yields(null, {statusCode: 201}, null);
            ppimport.importContent(path, function (error) {
                expect(error).to.be.undefined;
                done();
            });
        });

        it('should result in an HttpError when the request fails, holding the originating error as cause', function (done) {
            var path = "./file.xml";
            var expectedCause = new Error('error');
            requestStub.yields(expectedCause, null, null);
            ppimport.importContent(path, function (error) {
                expect(error).to.be.an.instanceOf(ppimport.HttpError);
                expect(error.message).to.be.a.string('The request failed, see cause for more info');
                expect(error.cause).to.be.equal(expectedCause);
                done();
            });
        });

        it('should result in an Error when piping yields an error', function (done) {
            var path = "./file.xml";
            var expectedError = new Error('expected');
            stream.pipe = function() {
                setTimeout(function() {
                    stream.emit('error', expectedError);
                }, 1);
                return stream;
            };
            ppimport.importContent(path, function (error) {
                expect(error).to.be.equal(expectedError);
                done();
            });
        });

    });


    describe('import directory', function () {
        it('should take a directory as parameter');
    });


    //Test just to be sure if we created the custom error appropriately
    describe('PathError', function () {
        var error;
        beforeEach(function () {
            error = new ppimport.PathError();
        });

        it('should have PathError which is actually an instance of PathError', function () {
            expect(error).to.be.an.instanceOf(ppimport.PathError);
        });

        it('should be inheriting from Error', function () {
            expect(error).to.be.an.instanceOf(Error);
        });

        it('should have message as specified in it\'s constructor', function () {
            error = new ppimport.PathError('message');
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
    });

    describe('HttpError', function () {
        it('should print a stack containing the cause');
    });
});