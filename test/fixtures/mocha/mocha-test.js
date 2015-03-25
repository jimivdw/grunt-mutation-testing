var assert = require("assert");
var code1 = require("./script1");

describe('Fixtures', function () {
    describe('Script 1', function () {
        it('add', function () {
            var actual = code1.add([1, 2]);
            var expected = 3;
            assert.equal(actual, expected);
        });
        it('sub', function () {
            var actual = code1.sub([2, 1]);
            var expected = 1;
            assert.equal(actual, expected);
        });
        it('mul', function () {
            var actual = code1.mul([2, 5]);
        });
    });
});
