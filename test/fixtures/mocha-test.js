var assert = require("assert")
var code1 = require("./script1")
var code2 = require("./script2")

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
  });

  describe('Script 2', function () {
    it('mul', function () {
      assert.equal(6, code2.mul([2, 3]));
      //test.equal(6, 6);
    });
  });
});
