var chai = require("chai");
var expect = chai.expect;
var should = chai.should();
var ppimport = require("../lib/ppimport")({polopolyUrl: 'http://test.url', username: 'user name', password: 'password'});
var sinon = require('sinon');
var request = require('request');
var fs = require('fs');
var events = require('events');


describe('ppimport', function () {
    describe('import file', function () {
        var requestStub;
        var defaultsRequestStub;
        var fsStub;

        function Stream() {
            this.pipe = function () {
                return this
            };
            events.EventEmitter.call(this);
        };
        var stream;
        Stream.prototype.__proto__ = events.EventEmitter.prototype;

        beforeEach(function () {
            stream = new Stream();
            fsStub = sinon.stub(fs, 'createReadStream').returns(stream);
            requestStub = sinon.stub(request, 'put');
            defaultsRequestStub = sinon.stub(request, 'defaults').returns(request);
        });

        afterEach(function () {
            request.defaults.restore();
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
                expect(requestStub.getCall(0).args[0]).to.be.string('http://test.url?result=true&username=user%20name&password=password');
                done();
            });
        });

        it('should send the XML file to polopoly via HTTP communication and should content-type as options', function (done) {
            var path = "./file.xml";
            requestStub.yields(null, {statusCode: 200}, null);
            ppimport.importContent(path, function (error) {
                expect(JSON.stringify(defaultsRequestStub.getCall(0).args[0])).to.be.equal(JSON.stringify({headers: {'Content-Type': 'text/xml'}}));
                done();
            });
        });

        it('should send the XML file to localhost when no url is given to the constructor.', function (done) {
            var path = "./file.xml";
            var defaultPpImport = require('../lib/ppimport')();
            requestStub.yields(null, {statusCode: 200}, null);
            defaultPpImport.importContent(path, function () {
                expect(requestStub.getCall(0).args[0]).to.be.string('http://localhost?result=true&username=admin&password=admin');
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
            stream.pipe = function () {
                setTimeout(function () {
                    stream.emit('error', expectedError);
                }, 0);
                return stream;
            };
            ppimport.importContent(path, function (error) {
                expect(error).to.be.equal(expectedError);
                done();
            });
        });

    });


    describe('import directory', function () {
        var archiveCreateSpy;
        var archiveBulkSpy;
        var archiveFinalizeSpy;
        var archiver = require('archiver');
        var ArchiverCore = require('../node_modules/archiver/lib/modules/core');

        beforeEach(function () {
            archiveCreateSpy = sinon.spy(archiver, 'create');
            archiveBulkSpy = sinon.spy(ArchiverCore.prototype, 'bulk');
            archiveFinalizeSpy = sinon.spy(ArchiverCore.prototype, 'finalize');
        });

        afterEach(function () {
            archiver.create.restore();
            ArchiverCore.prototype.bulk.restore();
            ArchiverCore.prototype.finalize.restore();
        });


        it('should allow a directory as parameter', function (done) {
            var path = "./";
            ppimport.importContent(path, function (error) {
                expect(error).to.be.undefined;
                done();
            });
        });

        it('should create an archiver with format zip', function (done) {
            var path = "./";
            ppimport.importContent(path, function (error) {
                expect(error).to.be.undefined;
                expect(archiveCreateSpy.calledOnce).to.be.ok;
                expect(archiveCreateSpy.getCall(0).args[0]).to.be.string('zip');
                done();
            });
        });


        it('should bulk archive all xml files within the given directory', function (done) {
            var path = "./";
            ppimport.importContent(path, function (error) {
                expect(error).to.be.undefined;
                expect(archiveBulkSpy.calledOnce).to.be.ok;
                expect(archiveBulkSpy.getCall(0).args[0][0].cwd).to.be.string(__dirname + '/');
                expect(archiveBulkSpy.getCall(0).args[0][0].src[0]).to.be.string('**/*.xml');
                expect(archiveBulkSpy.getCall(0).args[0][0].expand).to.be.thruthy;
                done();
            });
        });

        it('should result in a ArchiveError when an error on the archiver library occurs', function (done) {
            var path = "./";
            var expectedCause = new Error();
            setTimeout(function () {
                ArchiverCore.emit('error', expectedCause);
            }, 50);
            ppimport.importContent(path, function (error) {
                expect(error).to.be.an.instanceOf(ppimport.ArchiveError);
                expect(error.message).to.be.a.string('Archiving failed, see cause for more info');
                expect(error.cause).to.be.equal(expectedCause);
                done();
            });
        });

        it('should finalize the archive ', function (done) {
            var path = "./";
            ppimport.importContent(path, function (error) {
                expect(error).to.be.undefined;
                expect(archiveFinalizeSpy.calledOnce).to.be.ok;
                done();
            });
        });

        it('should recurse a directory structure');
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