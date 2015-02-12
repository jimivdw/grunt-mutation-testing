var expect = require("chai").expect;
var updateExpressions = require("./update-expressions");
describe('Update expressions', function () {
    it('increment A', function () {
        var x = 1;
        expect(updateExpressions.incrementA(x)).to.equal(true);
    });

    it('decrement A', function () {
        var x = 1;
        expect(updateExpressions.decrementA(x)).to.equal(false);
    });

    it('increment B', function () {
        var x = 100;
        expect(updateExpressions.incrementB(x)).to.equal(false);
    });

    it('decrement B', function () {
        var x = 100;
        expect(updateExpressions.decrementB(x)).to.equal(true);
    });
});
