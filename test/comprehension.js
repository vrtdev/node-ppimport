var chai = require('chai');
var expect = chai.expect;

function MyObject() {

}
MyObject.prototype.myFunction = function() {

}


describe('test', function() {
    it('should understand prototype function', function() {
        var myObjectInstance = new MyObject();
        expect(myObjectInstance.myFunction).to.exist;
    })

    it('should not get the prototyped function when omitting new', function() {
        var myObjectInstance = MyObject();
        expect(myObjectInstance).to.be.undefined;
    });

    it('pure objects do not have prototypes', function() {
        var object = {};
        expect(object.prototype).to.be.undefined;
        expect(object.toString()).to.be.equal('[object Object]');
    });

    it('pure objects can be assigned a prototype via Object', function() {
        var object = {};
        Object.prototype.myFunction = function() {};
        expect(object.myFunction).to.exist;
    });

    it('Crockford\'s take on inheritance', function() {
        var constructor = function() {
            var that = {};

            var myFunction = function() {

            };
            that.myFunction = myFunction;

            return that;
        }
        var object = constructor();
        expect(object.myFunction).to.exist;

    });
});