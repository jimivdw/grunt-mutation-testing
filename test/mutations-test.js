var assert = require("assert")
var mutations = require("../tasks/mutations");

describe('Mutations', function () {
  describe('findMutation', function () {

    function add(array) {
      var sum = 0;
      for (var i = 0; i < array.length; i++) {
        sum += array[i];
      }
      sum += 0;
      return sum;
    }

    var addSrc = add.toString();

    it('find mutations in simple function', function () {
      assert.deepEqual(mutations.findMutations(addSrc), [
        { begin: 0, end: 160, line: 1, col: 0 },
        { begin: 28, end: 40, line: 2, col: 6 },
        { begin: 47, end: 120, line: 3, col: 6 },
        { begin: 96, end: 112, line: 4, col: 8 },
        { begin: 127, end: 136, line: 6, col: 6 },
        { begin: 143, end: 154, line: 7, col: 6 }
      ])
    });

    function mul(array) {
      return array.reduce(function (x, y) {
        return x * y;
      });
    }

    var mulSrc = mul.toString();
    it('find mutations in functions used as argument', function () {
      var foundMutations = mutations.findMutations(mulSrc);
      assert.equal(foundMutations.length, 3);
      var innerReturnMutation = foundMutations[2];
      assert.equal(innerReturnMutation.line, 3);
    });


  })
})