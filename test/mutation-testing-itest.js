var assertExpectedReport = require('./test-utils').assertExpectedReport;

describe('Mutation Testing', function () {
    it('flags all mutation if the test returns always true', function () {
        assertExpectedReport('reports/mutation-test/flag-all-mutations/mutations.txt', 'test/expected/flag-all-mutations.txt');
        assertExpectedReport('reports/mutation-test/flag-all-mutations/mutations.json', 'test/expected/flag-all-mutations.json');
    });
    it('flags all mutation if the test returns always true, which is the default', function () {
        assertExpectedReport('reports/mutation-test/flag-all-mutations-default/mutations.txt', 'test/expected/flag-all-mutations.txt');
    });
    it('flags all mutation aside from the ignored ones', function () {
        assertExpectedReport('reports/mutation-test/ignore/mutations.txt', 'test/expected/ignore.txt');
        assertExpectedReport('reports/mutation-test/ignore/mutations.json', 'test/expected/ignore.json');
    });
    it('stops and reports warning if tests fail already without any mutation', function () {
        assertExpectedReport('reports/mutation-test/test-is-failing-without-mutation/mutations.txt', 'test/expected/test-is-failing-without-mutation.txt');
        assertExpectedReport('reports/mutation-test/test-is-failing-without-mutation/mutations.json', 'test/expected/test-is-failing-without-mutation.json');
    });

    it('flags all mutations for which a mocha test returns true', function () {
        assertExpectedReport('reports/mutation-test/mocha/mutations.txt', 'test/expected/mocha.txt');
        assertExpectedReport('reports/mutation-test/mocha/mutations.json', 'test/expected/mocha.json');
    });
    it('flags all mutations for which a karma test returns true', function () {
        assertExpectedReport('reports/mutation-test/karma/mutations.txt', 'test/expected/karma.txt');
        assertExpectedReport('reports/mutation-test/karma/mutations.json', 'test/expected/karma.json');
    });

    it('flags all mutations of object literals', function () {
        assertExpectedReport('reports/mutation-test/attributes/mutations.txt', 'test/expected/attributes.txt');
        assertExpectedReport('reports/mutation-test/attributes/mutations.json', 'test/expected/attributes.json');
    });
    it('flags all mutations of arguments', function () {
        assertExpectedReport('reports/mutation-test/arguments/mutations.txt', 'test/expected/arguments.txt');
        assertExpectedReport('reports/mutation-test/arguments/mutations.json', 'test/expected/arguments.json');
    });
    it('flags all mutations of array literals', function () {
        assertExpectedReport('reports/mutation-test/arrays/mutations.txt', 'test/expected/arrays.txt');
        assertExpectedReport('reports/mutation-test/arrays/mutations.json', 'test/expected/arrays.json');
    });
    it('flags all mutations of replacing comparators within comparison', function() {
        assertExpectedReport('reports/mutation-test/comparisons/mutations.txt', 'test/expected/comparisons.txt');
        assertExpectedReport('reports/mutation-test/comparisons/mutations.json', 'test/expected/comparisons.json');
    });
    it('flags all mutations of replacing function calls with argument', function() {
        assertExpectedReport('reports/mutation-test/function-calls/mutations.txt', 'test/expected/function-calls.txt');
        assertExpectedReport('reports/mutation-test/function-calls/mutations.json', 'test/expected/function-calls.json');
    });
    it('flags all literal mutations', function() {
        assertExpectedReport('reports/mutation-test/literals/mutations.txt', 'test/expected/literals.txt');
        assertExpectedReport('reports/mutation-test/literals/mutations.json', 'test/expected/literals.json');
    });
    it('flags all unary expression mutations', function() {
        assertExpectedReport('reports/mutation-test/unary-expressions/mutations.txt', 'test/expected/unary-expressions.txt');
        assertExpectedReport('reports/mutation-test/unary-expressions/mutations.json', 'test/expected/unary-expressions.json');
    });
    it('flags all logical expression mutations', function() {
        assertExpectedReport('reports/mutation-test/logical-expressions/mutations.txt', 'test/expected/logical-expressions.txt');
        assertExpectedReport('reports/mutation-test/logical-expressions/mutations.json', 'test/expected/logical-expressions.json');
    });
    it('flags all mutations of replacing math operators', function() {
        assertExpectedReport('reports/mutation-test/math-operators/mutations.txt', 'test/expected/math-operators.txt');
        assertExpectedReport('reports/mutation-test/math-operators/mutations.json', 'test/expected/math-operators.json');
    });
    it('flags all mutations of replacing update expressions', function() {
        assertExpectedReport('reports/mutation-test/update-expressions/mutations.txt', 'test/expected/update-expressions.txt');
        assertExpectedReport('reports/mutation-test/update-expressions/mutations.json', 'test/expected/update-expressions.json');
    });
    it('flags mutations in code containing HTML fragments', function() {
        assertExpectedReport('reports/mutation-test/html-fragments/mutations.txt', 'test/expected/html-fragments.txt');
        assertExpectedReport('reports/mutation-test/html-fragments/mutations.json', 'test/expected/html-fragments.json');
    });
    it('dont test inside of surviving mutations', function() {
        assertExpectedReport('reports/mutation-test/dont-test-inside-surviving-mutations/mutations.txt', 'test/expected/dont-test-inside-surviving-mutations.txt');
        assertExpectedReport('reports/mutation-test/dont-test-inside-surviving-mutations/mutations.json', 'test/expected/dont-test-inside-surviving-mutations.json');
    });
});
