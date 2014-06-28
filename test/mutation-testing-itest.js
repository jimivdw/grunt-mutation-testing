'use strict';

var assertExpectedReport = require('./test-utils').assertExpectedReport;

describe('Mutation Testing', function () {
  it('flags all mutation if the test returns always true', function () {
    assertExpectedReport('tmp/flag-all-mutations.txt', 'test/expected/flag-all-mutations.txt');
  });
  it('flags all mutation if the test returns always true, which is the default', function () {
    assertExpectedReport('tmp/flag-all-mutations-default.txt', 'test/expected/flag-all-mutations.txt');
  });
  it('flags all mutations for which a mocha test returns true', function () {
    assertExpectedReport('tmp/mocha.txt', 'test/expected/mocha.txt');
  });
  it('flags all mutations for which a karma test returns true', function () {
    assertExpectedReport('tmp/karma.txt', 'test/expected/karma.txt');
  });
});