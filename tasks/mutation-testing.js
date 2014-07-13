/*
 * grunt-mutation-testing
 * 
 *
 * Copyright (c) 2014 Marco Stahl
 * Licensed under the MIT license.
 */

'use strict';
var esprima = require('esprima');
var fs = require('fs');
var exec = require('sync-exec');
var path = require('path');
var qq = require('q');
var mutate = require('./mutations');
var _ = require('lodash');
var mutationTestingKarma = require('./mutation-testing-karma');

function canBeIgnored(opts, src, mutation) {
  if (!opts.ignore) {
    return false;
  }
  var ignorePatterns = _.isArray(opts.ignore) ? opts.ignore : [opts.ignore];
  var affectedSrcPart = src.substring(mutation.begin, mutation.end);
  return _.any(ignorePatterns, function (ignorePattern) {
    return ignorePattern.test(affectedSrcPart);
  });
}

/**
 * @param {string} srcFilename
 * @param {function} runTests
 * @param {function} logMutation
 */
function mutationTestFile(srcFilename, runTests, logMutation, log, opts) {
  var src = fs.readFileSync(srcFilename, 'UTF8');
  var mutations = mutate.findMutations(src);
  var q = qq({});

  log('\nMutating file ' + srcFilename + '\n');
  mutations.forEach(function (mutation) {
    if (canBeIgnored(opts, src, mutation))
    {
      return;
    }
    q = q.then(function () {
      var currentMutationPosition = srcFilename + ':' + mutation.line + ':' + (mutation.col + 1);
      log(mutation.line + ',');
      fs.writeFileSync(srcFilename, mutate.applyMutation(src, mutation));
      return runTests().then(function (testSuccess) {
        if (testSuccess) {
          logMutation(currentMutationPosition + ' can be removed.');
        }
      });
    });
  });

  return q.fin(function () {
    console.log('Restore ', srcFilename);
    fs.writeFileSync(srcFilename, src);
  });
}


function mutationTest(grunt, task, opts) {
  var done = task.async();
  var q = qq();

  function logToMutationReport(fileDest, msg) {
    if (fileDest === 'LOG') {
      grunt.log.writeln('\n' + msg);
      return;
    }
    if (!grunt.file.exists(fileDest)) {
      grunt.file.write(fileDest, '');
    }
    fs.appendFileSync(fileDest, msg + '\n');
  }

  function runTests() {
    var dfd = qq.defer();
    if (typeof opts.test === 'string') {
      var execResult = exec(opts.test);
      dfd.resolve(execResult.status === 0);
    } else {
      opts.test(function (ok) {
        dfd.resolve(ok);
      });
    }
    return dfd.promise;
  }

  var files = task.files;

  opts.before(function () {
    // run first without mutations
    runTests().done(function (testOk) {
      if (!testOk) {
        files.forEach(function (file) {
          logToMutationReport(file.dest, 'Tests fail without mutations.');
        });
      } else {
        files.forEach(function (file) {
          q = q.then(function () {
            var validFiles = file.src.filter(function (filepath) {
              if (!grunt.file.exists(filepath)) {
                grunt.log.warn('Source file "' + filepath + '" not found.');
                return false;
              } else {
                return true;
              }
            });

            if (validFiles.length === 0) {
              grunt.log.warn('Found no valid files in ' + JSON.stringify(file.orig.src));
              return false;
            }

            function log(msg) {
              grunt.log.write(msg);
            }

            var logMutationToFileDest = _.partial(logToMutationReport, file.dest);

            var q2 = qq();
            validFiles.forEach(function (srcFile) {
              q2 = q2.then(function () {
                return mutationTestFile(path.resolve(srcFile), runTests, logMutationToFileDest, log, opts);
              });
            });
            return q2;
          });
        });
      }
      q.then(function () {
        var dfd = qq.defer();
        opts.after(function () {
          dfd.resolve();
        });
        return dfd.promise;
      });
      q.done(done);
    });
  });
}

function callDone(done) {
  done(true);
}

var DEFAULT_OPTIONS = {
  test: callDone,
  before: callDone,
  after: callDone
};

module.exports = function (grunt) {
  grunt.registerMultiTask('mutationTest', 'Test your tests by mutate the code.', function () {
    var opts = this.options(DEFAULT_OPTIONS);
    mutationTestingKarma.init(grunt, opts);
    mutationTest(grunt, this, opts);
  });
};
