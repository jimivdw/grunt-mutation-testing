var assert = require("chai").assert;
var grunt = require('grunt');
var _ = require('lodash');

function makePathsRelative(reportFileContent) {
    return reportFileContent.replace(/^.*fixtures/gm, 'test/fixtures');
}

/**
 * Checks that two files are equivalent without requiring all lines to be in the same order
 * @param actualFilename
 * @param expectedFilename
 */
function assertExpectedReport(actualFilename, expectedFilename) {
    var actual = makePathsRelative(grunt.file.read(actualFilename)).toString().split('\n');
    var expected = makePathsRelative(grunt.file.read(expectedFilename)).toString().split('\n');
    assert.equal(actual.length, expected.length);
    var difference = _.difference(actual, expected);
    assert.equal(difference.length, 0, 'Actual and Expected differ: \n\t\t' + difference.toString().replace(/,test/g, ',\n\t\ttest'));
}

module.exports.assertExpectedReport = assertExpectedReport;
