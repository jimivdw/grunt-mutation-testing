'use strict';

var assertExpectedReport = require('./test-utils').assertExpectedReport;

describe('Mutation Testing', function () {
  it('flags all mutation if the test returns always true', function () {
    assertExpectedReport('tmp/flag-all-mutations.txt', 'test/expected/flag-all-mutations.txt');
  });
  it('flags all mutation if the test returns always true, which is the default', function () {
    assertExpectedReport('tmp/flag-all-mutations-default.txt', 'test/expected/flag-all-mutations.txt');
  });
  it('flags all mutation aside from the ignored ones', function () {
    assertExpectedReport('tmp/ignore.txt', 'test/expected/ignore.txt');
  });
  it('stops and reports warning if tests fail already without any mutation', function () {
    assertExpectedReport('tmp/test-is-failing-without-mutation.txt', 'test/expected/test-is-failing-without-mutation.txt');
  });
  it('flags all mutations for which a mocha test returns true', function () {
    assertExpectedReport('tmp/mocha.txt', 'test/expected/mocha.txt');
  });
  it('flags all mutations for which a karma test returns true', function () {
    assertExpectedReport('tmp/karma.txt', 'test/expected/karma.txt');
  });
  it('flags all mutations of object literals', function () {
    assertExpectedReport('tmp/attributes.txt', 'test/expected/attributes.txt');
  });
  it('flags all mutations of arguments', function () {
    assertExpectedReport('tmp/arguments.txt', 'test/expected/arguments.txt');
  });
  it('flags all mutations of array literals', function () {
    assertExpectedReport('tmp/array.txt', 'test/expected/array.txt');
  });
  it('flags all mutations of replacing function calls with argument', function () {
    assertExpectedReport('tmp/function-calls.txt', 'test/expected/function-calls.txt');
  });
  it('flags all literal mutations', function () {
    assertExpectedReport('tmp/literals.txt', 'test/expected/literals.txt');
  });
  it('flags all mutations of replacing comparators within comparison', function () {
    assertExpectedReport('tmp/comparisons.txt', 'test/expected/comparisons.txt');
  });
  it('dont test inside of not failing mutations', function () {
    assertExpectedReport('tmp/dont-test-inside-not-failing-mutations.txt', 'test/expected/dont-test-inside-not-failing-mutations.txt');
  });
});
