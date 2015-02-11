var _ = require('lodash');
var assert = require("assert");
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
        { begin: 0, end: 160, line: 1, col: 0, replacement: ''},
        { begin: 28, end: 40, line: 2, col: 6, replacement: ''},
        { begin: 38, col : 16, end : 39, line : 2, replacement : '1'},
        { begin: 47, end: 120, line: 3, col: 6, replacement: '' },
        { begin: 60, col : 19, end : 61, line : 3, replacement : '1'},
        { begin: 64, col : 23, end : 67, line : 3, replacement : '<='},
        { begin: 64, col : 23, end : 67, line : 3, replacement : '>='},
        { begin: 96, end: 112, line: 4, col: 8, replacement: ''},
        { begin: 127, end: 136, line: 6, col: 6, replacement: ''},
        { begin: 134, col : 13, end : 135, line : 6, replacement : '1'},
        { begin: 143, end: 154, line: 7, col: 6, replacement: ''}
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
      var innerReturnMutation = foundMutations[3];
      assert.deepEqual(innerReturnMutation, { begin: 74, end: 87, line: 3, col: 8, replacement: '' });
    });


    function createSimplePerson(name) {
      return {
        name: name
      }
    }

    var createSimplePersonSrc = createSimplePerson.toString();
    it('find mutations in simple object literals', function () {
      var foundMutations = mutations.findMutations(createSimplePersonSrc);
      assert.equal(foundMutations.length, 3);
      var attributeMutation = foundMutations[2];
      assert.deepEqual(attributeMutation, {
        begin: 59, end: 69, line: 3, col: 8, replacement: ''
      });
    });

    function createPerson(name, age) {
      return {
        name: name,
        age: age
      }
    }

    var createPersonSrc = createPerson.toString();
    it('find mutations in object literals', function () {
      var foundMutations = mutations.findMutations(createPersonSrc);
      assert.equal(foundMutations.length, 4);
      var attributeMutation = foundMutations[2];
      // take care for the comma
      assert.deepEqual(attributeMutation, {
        begin: 58, end: 78, line: 3, col: 8, replacement: ''
      });
    });

    function containsName(persons, name) {
      return _.contains(_.pluck(persons, 'name'), name);
    }

    var containsNameSrc = containsName.toString();
    it('find mutations in function arguments', function () {
      var foundMutations = mutations.findMutations(containsNameSrc);
      //console.log(JSON.stringify(foundMutations));
      assert.deepEqual(foundMutations, [
        {"begin": 0, "end": 101, "line": 1, "col": 0, "replacement": ""},
        {"begin": 45, "end": 95, "line": 2, "col": 6, "replacement": ""},
        {"begin": 63, "end": 87, "line": 2, "col": 24, "replacement": "\"MUTATION!\""},
        {"begin": 71, "end": 78, "line": 2, "col": 32, "replacement": "\"MUTATION!\""},
        {"begin": 80, "end": 86, "line": 2, "col": 41, "replacement": "\"MUTATION!\""},
        {"begin": 63, "col": 24, "end": 87, "line": 2, "replacement": "_"},
        {"begin": 89, "end": 93, "line": 2, "col": 50, "replacement": "\"MUTATION!\""},
        {"begin": 52, "col": 13, "end": 94, "line": 2, "replacement": "_"}
      ]);
    });

    function createArray() {
      var el = {};
      return [el, 'string', 123];
    }

    var createArraySrc = createArray.toString();
    it('find mutations in array literals', function () {
      var foundMutations = mutations.findMutations(createArraySrc);
      assert.deepEqual(foundMutations, [
        { begin: 0, end: 83, line: 1, col: 0, replacement: '' },
        { begin: 31, end: 43, line: 2, col: 6, replacement: '' },
        { begin: 50, end: 77, line: 3, col: 6, replacement: '' },
        { begin: 58, end: 62, line: 3, col: 14, replacement: '' },
        { begin: 62, end: 72, line: 3, col: 18, replacement: '' },
        {"begin": 62, "col": 18, "end": 70, "line": 3, "replacement": "\"MUTATION!\""},
        { begin: 72, end: 75, line: 3, col: 28, replacement: '' },
        {"begin": 72, "col": 28, "end": 75, "line": 3, "replacement": "124"}
      ]);
    });


    function encodeUrl(url) {
      return encodeURI(url);
    }

    var encodeUrlSrc = encodeUrl.toString();
    it("find mutations by replacing function call with it's argument", function () {
      var foundMutations = mutations.findMutations(encodeUrlSrc);
      assert.deepEqual(foundMutations[3], { begin: 39, end: 53, line: 2, col: 13, replacement: 'url' });
    });

    function trim(string) {
      return string.trim();
    }

    var trimSrc = trim.toString();
    it("find mutations by replacing method calls with object", function () {
      var foundMutations = mutations.findMutations(trimSrc);
      assert.deepEqual(foundMutations[2], { begin: 37, end: 50, line: 2, col: 13, replacement: 'string' });
    });

    function getLiterals() {
      return {
        string: "string",
        number: 42,
        boolean: true
      };
    }

    var getLiteralsSrc = getLiterals.toString();
    it("find mutations by replacing literals", function () {
      var foundMutations = mutations.findMutations(getLiteralsSrc);
      assert.deepEqual(foundMutations[3], { begin: 56, end: 64, line: 3, col: 16, replacement: '"MUTATION!"' });
      assert.deepEqual(foundMutations[5], { begin: 82, end: 84, line: 4, col: 16, replacement: '43' });
      assert.deepEqual(foundMutations[7], { begin: 103, end: 107, line: 5, col: 17, replacement: 'false' });
    });

  })
});
