'use strict';

var assertExpectedReport = require('./test-utils').assertExpectedReport;

describe('Mutation Testing', function () {
    it('flags all mutations for which a grunt run returns a good status', function () {
        assertExpectedReport('tmp/grunt.txt', 'test/expected/mocha.txt');
    });
});
