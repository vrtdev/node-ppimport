var chai = require("chai");
var expect = chai.expect;
var ppimport = require("../lib/ppimport")('http://pp-dev.vrt.be/polopoly/import');

describe('ppimport', function () {
    describe('import file', function () {
         it('should return a 200', function (done) {
            var path = "./001_testcategory_deredactie.xml";
            ppimport.importContent(path, function (error) {
                console.log(error);
                expect(error).to.be.undefined;
                done();
            });
        });
    });
});
