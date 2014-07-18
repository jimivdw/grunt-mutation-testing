var assert = require("chai").assert;
var grunt = require('grunt');

function makePathsRelative(reportFileContent) {
  return reportFileContent.replace(/^.*fixtures/gm, 'test/fixtures');
}

function assertExpectedReport(actualFilename, expectedFilename) {
  var actual = makePathsRelative(grunt.file.read(actualFilename));
  var expected = makePathsRelative(grunt.file.read(expectedFilename));
  assert.equal(actual, expected);
}

module.exports.assertExpectedReport = assertExpectedReport;