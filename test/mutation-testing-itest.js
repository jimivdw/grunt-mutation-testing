'use strict';

var assert = require("assert")
var mutations = require("../tasks/mutations");
var grunt = require('grunt');

describe('Mutation Testing', function () {
  it('flags all mutation if the test returns always true', function () {
    var actual = grunt.file.read('tmp/flag-all-mutations.txt');
    var expected = grunt.file.read('test/expected/flag-all-mutations.txt');
    assert.equal(actual, expected);
  });
  it('flags all mutations for which a mocha test returns true', function () {
    var actual = grunt.file.read('tmp/mocha.txt');
    var expected = grunt.file.read('test/expected/mocha.txt');
    assert.equal(actual, expected);
  });
  it('flags all mutations for which a karma test returns true', function () {
    var actual = grunt.file.read('tmp/karma.txt');
    var expected = grunt.file.read('test/expected/karma.txt');
    assert.equal(actual, expected);
  });
});