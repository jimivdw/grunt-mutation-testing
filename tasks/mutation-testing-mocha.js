var Mocha = require('mocha');
var requireUncache = require('require-uncache');
var _ = require('lodash');

exports.init = function (grunt, opts) {
  if (!opts.mocha) {
    return;
  }

  var testFiles = grunt.file.expand(opts.mocha.testFiles);
  if (testFiles.length === 0) {
    grunt.log.error('No test files found for testFiles =', opts.mocha.testFiles);
  }

  opts.test = function (done) {
    //https://github.com/visionmedia/mocha/wiki/Third-party-reporters
    var mocha = new Mocha({reporter: function (runner) {
      //dummyReporter
    }});

    mocha.suite.on('pre-require', function (context, file) {
      requireUncache(file);
    });

    testFiles.forEach(function (testFile) {
      mocha.addFile(testFile);
    });

    try {
      mocha.run(function (errCount) {
        var withoutErrors = (errCount === 0);
        done(withoutErrors);
      });
    } catch (error) {
      done(false);
    }
  };

};