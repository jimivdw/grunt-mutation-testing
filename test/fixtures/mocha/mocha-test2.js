var assert = require("assert");
var code2 = require("./script2");

describe('Fixtures', function () {
    describe('Script 2', function () {
        it('mul', function () {
            assert.equal(6, code2.mul([2, 3]));
            //test.equal(6, 6);
        });
    });
});
