var _ = require('lodash');
var assert = require("assert");
var mutations = require("../tasks/mutations");

describe('Mutations', function() {
    describe('findMutation', function() {

        function add(array) {
            var sum = 0;
            for(var i = 0; i < array.length; i++) {
                sum += array[i];
            }
            sum += 0;
            return sum;
        }

        var addSrc = add.toString();

        it('find mutations in simple function', function() {
            assert.deepEqual(mutations.findMutations(addSrc), [
                { begin: 0, end: 201, line: 1, col: 0, replacement: '' },
                { begin: 34, end: 46, line: 2, col: 12, replacement: '' },
                { begin: 44, end: 45, line: 2, col: 22, replacement: '1' },
                { begin: 59, end: 145, line: 3, col: 12, replacement: '' },
                { begin: 71, end: 72, line: 3, col: 24, replacement: '1' },
                { begin: 75, end: 78, line: 3, col: 28, replacement: '<=' },
                { begin: 75, end: 78, line: 3, col: 28, replacement: '>=' },
                { begin: 93, end: 95, line: 3, col: 46, replacement: '--' },
                { begin: 115, end: 131, line: 4, col: 16, replacement: '' },
                { begin: 158, end: 167, line: 6, col: 12, replacement: '' },
                { begin: 165, end: 166, line: 6, col: 19, replacement: '1' },
                { begin: 180, end: 191, line: 7, col: 12, replacement: '' }
            ])
        });

        function mul(array) {
            return array.reduce(function(x, y) {
                return x * y;
            });
        }

        var mulSrc = mul.toString();
        it('find mutations in functions used as argument', function() {
            var foundMutations = mutations.findMutations(mulSrc);
            var innerReturnMutation = foundMutations[3];
            assert.deepEqual(innerReturnMutation, { begin: 87, end: 100, line: 3, col: 16, replacement: '' });
        });


        function createSimplePerson(name) {
            return {
                name: name
            }
        }

        var createSimplePersonSrc = createSimplePerson.toString();
        it('find mutations in simple object literals', function() {
            var foundMutations = mutations.findMutations(createSimplePersonSrc);
            assert.equal(foundMutations.length, 3);
            var attributeMutation = foundMutations[2];
            assert.deepEqual(attributeMutation, { begin: 73, end: 83, line: 3, col: 16, replacement: '' });
        });

        function createPerson(name, age) {
            return {
                name: name,
                age: age
            }
        }

        var createPersonSrc = createPerson.toString();
        it('find mutations in object literals', function() {
            var foundMutations = mutations.findMutations(createPersonSrc);
            assert.equal(foundMutations.length, 4);
            var attributeMutation = foundMutations[2];
            // take care for the comma
            assert.deepEqual(attributeMutation, { begin: 72, end: 100, line: 3, col: 16, replacement: '' });
        });

        function containsName(persons, name) {
            return _.contains(_.pluck(persons, 'name'), name);
        }

        var containsNameSrc = containsName.toString();
        it('find mutations in function arguments', function() {
            var foundMutations = mutations.findMutations(containsNameSrc);
            assert.deepEqual(foundMutations, [
                { begin: 0, end: 111, line: 1, col: 0, replacement: '' },
                { begin: 51, end: 101, line: 2, col: 12, replacement: '' },
                { begin: 69, end: 93, line: 2, col: 30, replacement: '"MUTATION!"' },
                { begin: 77, end: 84, line: 2, col: 38, replacement: '"MUTATION!"' },
                { begin: 86, end: 92, line: 2, col: 47, replacement: '"MUTATION!"' },
                { begin: 69, end: 93, line: 2, col: 30, replacement: '_' },
                { begin: 95, end: 99, line: 2, col: 56, replacement: '"MUTATION!"' },
                { begin: 58, end: 100, line: 2, col: 19, replacement: '_' }
            ]);
        });

        function createArray() {
            var el = {};
            return [el, 'string', 123];
        }

        var createArraySrc = createArray.toString();
        it('find mutations in array literals', function() {
            var foundMutations = mutations.findMutations(createArraySrc);
            assert.deepEqual(foundMutations, [
                { begin: 0, end: 99, line: 1, col: 0, replacement: '' },
                { begin: 37, end: 49, line: 2, col: 12, replacement: '' },
                { begin: 62, end: 89, line: 3, col: 12, replacement: '' },
                { begin: 70, end: 74, line: 3, col: 20, replacement: '' },
                { begin: 74, end: 84, line: 3, col: 24, replacement: '' },
                { begin: 74, end: 82, line: 3, col: 24, replacement: '"MUTATION!"' },
                { begin: 84, end: 87, line: 3, col: 34, replacement: '' },
                { begin: 84, end: 87, line: 3, col: 34, replacement: '124' }
            ]);
        });


        function encodeUrl(url) {
            return encodeURI(url);
        }

        var encodeUrlSrc = encodeUrl.toString();
        it("find mutations by replacing function call with it's argument", function() {
            var foundMutations = mutations.findMutations(encodeUrlSrc);
            assert.deepEqual(foundMutations[3], { begin: 45, end: 59, line: 2, col: 19, replacement: 'url' });
        });

        function trim(string) {
            return string.trim();
        }

        var trimSrc = trim.toString();
        it("find mutations by replacing method calls with object", function() {
            var foundMutations = mutations.findMutations(trimSrc);
            assert.deepEqual(foundMutations[2], { begin: 43, end: 56, line: 2, col: 19, replacement: 'string' });
        });

        function getLiterals() {
            return {
                string: "string",
                number: 42,
                boolean: true
            };
        }

        var getLiteralsSrc = getLiterals.toString();
        it("find mutations by replacing literals", function() {
            var foundMutations = mutations.findMutations(getLiteralsSrc);
            assert.deepEqual(foundMutations[3], { begin: 70, end: 78, line: 3, col: 24, replacement: '"MUTATION!"' });
            assert.deepEqual(foundMutations[5], { begin: 104, end: 106, line: 4, col: 24, replacement: '43' });
            assert.deepEqual(foundMutations[7], { begin: 133, end: 137, line: 5, col: 25, replacement: 'false' });
        });

    })
});
