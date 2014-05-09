var chai = require("chai");
var expect = chai.expect;
var ppimport = require("../lib/ppimport")({polopolyUrl: 'http://test.url', username: 'user name', password: 'password'});
var sinon = require('sinon');
var request = require('request');
var fs = require('fs');
var events = require('events');
var errors = require('../lib/errors');


describe('ppimport', function () {
    describe('import directory', function () {
        var archiveCreateSpy;
        var archiveBulkSpy;
        var archiveFinalizeStub;
        var archivePipeStub;
        var requestStub;
        var defaultsRequestStub;
        var archiver = require('archiver');
        var ArchiverCore = require('../node_modules/archiver/lib/modules/core');

        function Stream() {
            this.pipe = function () {
                return this;
            };
            events.EventEmitter.call(this);
        }

        var stream;
        Stream.prototype.__proto__ = events.EventEmitter.prototype;

        var finalize = function () {
        };

        var standin = {
            finalize: function () {
                finalize();
            }
        };

        beforeEach(function () {
            stream = new Stream();
            archiveCreateSpy = sinon.spy(archiver, 'create');
            archiveBulkSpy = sinon.spy(ArchiverCore.prototype, 'bulk');
            archiveFinalizeStub = sinon.stub(ArchiverCore.prototype, 'finalize', standin.finalize);
            archivePipeStub = sinon.stub(ArchiverCore.prototype, 'pipe').returns(stream);
            requestStub = sinon.stub(request, 'put').returns(stream);
            defaultsRequestStub = sinon.stub(request, 'defaults').returns(request);

        });

        afterEach(function () {
            archiver.create.restore();
            ArchiverCore.prototype.bulk.restore();
            ArchiverCore.prototype.finalize.restore();
            ArchiverCore.prototype.pipe.restore();
            request.defaults.restore();
            request.put.restore();
            finalize = function() {
            };
        });


        it('should allow a directory as parameter', function (done) {
            var path = "./test";
            finalize = function () {
                requestStub.getCall(0).args[1](null, {statusCode: 200}, null);
            }
            ppimport.importContent(path, function (error) {
                expect(error).to.be.null;
                done();
            });
        });

        it('should create an archiver with format zip', function (done) {
            var path = "./test";
            finalize = function () {
                requestStub.getCall(0).args[1](null, {statusCode: 200}, null);
            }
            ppimport.importContent(path, function (error) {
                expect(error).to.be.null;
                expect(archiveCreateSpy.calledOnce).to.be.ok;
                expect(archiveCreateSpy.getCall(0).args[0]).to.be.equal('zip');
                done();
            });
        });

        it('should pipe archive to stream', function (done) {
            var path = "./test";
            finalize = function () {
                requestStub.getCall(0).args[1](null, {statusCode: 200}, null);
            }
            ppimport.importContent(path, function (error) {
                expect(error).to.be.null;
                expect(archivePipeStub.calledOnce).to.be.ok;
                done();
            });
        });


        it('should bulk archive all xml files within the given directory', function (done) {
            var path = process.cwd() + '/test';
            finalize = function () {
                requestStub.getCall(0).args[1](null, {statusCode: 200}, null);
            }
            ppimport.importContent(path, function (error) {
                expect(error).to.be.null;
                expect(archiveBulkSpy.calledOnce).to.be.thruthy;
                expect(archiveBulkSpy.getCall(0).args[0][0].cwd).to.be.equal(process.cwd() + '/test');
                expect(archiveBulkSpy.getCall(0).args[0][0].src[0]).to.be.equal('**/*.xml');
                expect(archiveBulkSpy.getCall(0).args[0][0].expand).to.be.thruthy;
                done();
            });
        });


        it('should result in an Error when piping yields an error', function (done) {
            var path = "./test";
            var expectedError = new Error('expected');
            ArchiverCore.prototype.pipe.restore();
            archivePipeStub = sinon.stub(ArchiverCore.prototype, 'pipe', function () {
                setTimeout(function () {
                    stream.emit('error', expectedError);
                }, 0);
                return stream;
            });
            ppimport.importContent(path, function (error) {
                expect(error).to.be.equal(expectedError);
                done();
            });
        });


        it('should result in a ArchiveError when an error on the archiver library occurs', function (done) {
            var expectedCause = new Error();
            var path = './test';
            ArchiverCore.prototype.pipe.restore();
            archivePipeStub = sinon.stub(ArchiverCore.prototype, 'pipe', function () {
                archiveCreateSpy.returnValues[0].emit('error', expectedCause);
                return stream;
            });

            ppimport.importContent(path, function (error) {
                expect(error).to.be.instanceOf(errors.ArchiveError);
                expect(error.cause).to.be.equal(expectedCause);
                done();
            });
        });

        it('should finalize the archive when hooks report back', function (done) {
            var path = "./test";
            finalize = function () {
                requestStub.getCall(0).args[1](null, {statusCode: 200}, null);
            }
            ppimport.importContent(path, function (error) {
                expect(error).to.be.null;
                expect(archiveFinalizeStub.calledOnce).to.be.ok;
                done();
            });
        });

        it('should send the zip file to polopoly via HTTP communication and should have content-type application/octet-stream as options', function (done) {
            var path = "./test";
            finalize = function () {
                if (requestStub.getCall(0)) {
                    requestStub.getCall(0).args[1](null, {statusCode: 200}, null);
                } else {
                    console.log("requestStub never called!", requestStub);
                }
            }
            ppimport.importContent(path, function (error) {
                expect(JSON.stringify(defaultsRequestStub.getCall(0).args[0])).to.be.equal(JSON.stringify({headers: {'Content-Type': 'application/octet-stream'}}));
                done();
            });
        });

        it('should send the zip file to polopoly via HTTP communication', function (done) {
            var path = "./test";
            finalize = function () {
                requestStub.getCall(0).args[1](null, {statusCode: 200}, null);
            };
            ppimport.importContent(path, function (error) {
                expect(requestStub.getCall(0).args[0]).to.be.equal('http://test.url?result=true&username=user%20name&password=password&type=jar');
                done();
            });
        });

        it('should use the context information given to the spec', function (done) {
            var path = "./test";
            finalize = function () {
                requestStub.getCall(0).args[1](null, {statusCode: 200}, null);
            };
            ppimport.importContent(path, {"someval": 1}, function (error) {
                expect(error).to.be.null;
                expect(archiveFinalizeStub.calledOnce).to.be.ok;
                done();
            });
        });
    });

});