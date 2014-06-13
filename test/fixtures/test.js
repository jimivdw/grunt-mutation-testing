var code1 = require("./script1")
var code2 = require("./script2")

exports.mutation_testing = {
  setUp: function (done) {
    done();
  },
  add: function (test) {
    test.expect(1);

    var actual = code1.add([1, 2]);
    var expected = 3;
    test.equal(actual, expected);

    test.done();
  },
  sub: function (test) {
    test.expect(1);

    var actual = code1.sub([2, 1]);
    var expected = 1;
    test.equal(actual, expected);

    test.done();
  },
  mul: function (test) {
    test.expect(1);
    test.equal(6, code2.mul([2, 3]));
    test.done();
  }
};