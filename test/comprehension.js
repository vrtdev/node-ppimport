function MyObject() {

}
MyObject.prototype.myFunction = function() {
    return 'hello';
}


describe('test', function() {
    it('should understand prototype function', function() {
        var myObjectInstance = new MyObject();
        myObjectInstance.myFunction();
    })
});