var chai = require("chai");
var expect = chai.expect;

var sinon = require('sinon');
var request = require('request');
var fs = require('fs');
var events = require('events');
var errors = require('../lib/errors');


describe('ppimport', function () {
    describe('import file', function () {
        var singleFileHookFunction = function (path, context, callback) {
            callback(null, stream);
        };
        var ppimport = require("../lib/ppimport")({polopolyUrl: 'http://test.url', username: 'user name', password: 'password', hooks: {'.TEMPLATE': {singleFileFunction: singleFileHookFunction}}});
        var requestStub;
        var defaultsRequestStub;
        var fsStub;

        function Stream() {
            this.pipe = function () {
                return this
            };
            this.write = function () {
                return this;
            }
            this.end = function () {
                return this;
            }
            events.EventEmitter.call(this);
        };
        var stream;
        Stream.prototype.__proto__ = events.EventEmitter.prototype;

        beforeEach(function () {
            stream = new Stream();
            fsStub = sinon.stub(fs, 'createReadStream').returns(stream);
            requestStub = sinon.stub(request, 'put').returns(stream);
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
                expect(error).to.be.an.instanceOf(errors.PathError);
                expect(error.message).to.be.equal('Invalid path');
                expect(error.path).to.be.equal(process.cwd() + "/non-existing-file");
                done();
            });
        });

        it('should not result in an error when passing a path to an existing file', function (done) {
            var path = "./test/FunnY.XmL";
            requestStub.yields(null, {statusCode: 200}, null);
            ppimport.importContent(path, function (error) {
                expect(error).to.be.null;
                done();
            });
        });

        it('should result in a FormatError when passing a path to a file which is not a hook supported file', function (done) {
            var path = "test/simple-existing-file";
            ppimport.importContent(path, function (error) {
                expect(error).to.be.an.instanceOf(errors.FormatError);
                expect(error.message).to.be.equal('Invalid format, only .TEMPLATE,.XML,.DUST files are supported');
                done();
            });
        });

        it('should send the result of a specific hook via HTTP', function (done) {
            var path = "test/file.template";
            requestStub.yields(null, {statusCode: 200}, null);
            ppimport.importContent(path, function (error) {
                expect(requestStub.getCall(0).args[0]).to.be.equal('http://test.url?result=true&username=user%20name&password=password');
                done();
            });
        });

        it('should not allow the singleFileFunction hook to return anything else but an object supporting the pipe method', function (done) {
            var path = "test/file.template";
            stream = '';
            ppimport.importContent(path, function (error) {
                expect(error).to.be.instanceOf(TypeError);
                done();
            });
        });

        it('should report the hook function error when the hook callback sends one', function (done) {
            singleFileHookFunction = function (path, context, callback) {
                callback(expectedError);
            };
            var ppimport = require("../lib/ppimport")({polopolyUrl: 'http://test.url', username: 'user name', password: 'password', hooks: {'.TEMPLATE': {singleFileFunction: singleFileHookFunction}}});
            var path = "test/file.template";
            var expectedError = new Error();

            ppimport.importContent(path, function (error) {
                expect(error).to.be.equal(expectedError);
                done();
            });
        });

        it('should send the XML file to polopoly via HTTP', function (done) {
            var path = "./test/file.xml";
            requestStub.yields(null, {statusCode: 200}, null);
            ppimport.importContent(path, function (error) {
                expect(requestStub.getCall(0).args[0]).to.be.equal('http://test.url?result=true&username=user%20name&password=password');
                done();
            });
        });

        it('should send the XML file to polopoly via HTTP communication and should have content-type text/xml as options', function (done) {
            var path = "./test/file.xml";
            requestStub.yields(null, {statusCode: 200}, null);
            ppimport.importContent(path, function (error) {
                expect(JSON.stringify(defaultsRequestStub.getCall(0).args[0])).to.be.equal(JSON.stringify({headers: {'Content-Type': 'text/xml'}}));
                done();
            });
        });

        it('should send the XML file to localhost when no url is given to the constructor.', function (done) {
            var path = "./test/file.xml";
            var defaultPpImport = require('../lib/ppimport')();
            requestStub.yields(null, {statusCode: 200}, null);
            defaultPpImport.importContent(path, function () {
                expect(requestStub.getCall(0).args[0]).to.be.equal('http://localhost?result=true&username=admin&password=admin');
                done();
            });
        });

        it('should result in a HttpError when the server returns a status code not in 200 range', function (done) {
            var path = "./test/file.xml";
            requestStub.yields(null, {statusCode: 500}, "body");
            ppimport.importContent(path, function (error) {
                expect(error).to.be.an.instanceOf(errors.HttpError);
                expect(error.message).to.be.equal('The request ended with errors: statusCode (500), body: body');
                done();
            });
        });

        it('should not result in an Error when the server returns a status code in 200 range', function (done) {
            var path = "./test/file.xml";
            requestStub.yields(null, {statusCode: 201}, null);
            ppimport.importContent(path, function (error) {
                expect(error).to.be.null;
                done();
            });
        });

        it('should result in an HttpError when the request fails, holding the originating error as cause', function (done) {
            var path = "./test/file.xml";
            var expectedCause = new Error('error');
            requestStub.yields(expectedCause, null, null);
            ppimport.importContent(path, function (error) {
                expect(error).to.be.an.instanceOf(errors.HttpError);
                expect(error.message).to.be.equal('The request failed, see cause for more info');
                expect(error.cause).to.be.equal(expectedCause);
                done();
            });
        });

        it('should result in an Error when piping yields an error', function (done) {
            var path = "./test/file.xml";
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
});