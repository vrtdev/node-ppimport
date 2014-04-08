var chai = require("chai");
var expect = chai.expect;
var path = require('path');
var fs = require('fs');

function getAbsolutePath(filePath) {
    var absolutePath;
    if (filePath.indexOf('/') != 0) {
        var callerDir = path.dirname(module.filename);
        absolutePath = path.join(callerDir, filePath);
    } else {
        absolutePath = filePath;
    }
    return absolutePath;
}

var ppimport = require("../lib/ppimport")(JSON.parse(fs.readFileSync(getAbsolutePath('polopoly-options.json'), {encoding: "UTF-8"})));


describe('ppimport', function () {
    describe('import single file', function () {
         it('should return a 200', function (done) {
            var path = "./001_testcategory.xml";
            ppimport.importContent(path, function (error) {
                console.log(error);
                expect(error).to.be.undefined;
                done();
            });
        });
    });

    describe('import directory', function () {
        it('should return a 200', function (done) {
            var path = "./";
            ppimport.importContent(path, function (error) {
                console.log(error);
                expect(error).to.be.undefined;
                done();
            });
        });
    });
});
