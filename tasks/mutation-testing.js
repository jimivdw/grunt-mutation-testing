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

/**
 * @param {string} srcFilename
 * @param {function} runTests
 * @param {function} logMutation
 */
function mutationTestFile(srcFilename, runTests, logMutation, log) {
  var src = fs.readFileSync(srcFilename, 'UTF8');
  var mutations = mutate.findMutations(src);
  var q = qq({});

  log('\nMutating file ' + srcFilename + '\n');
  mutations.forEach(function (mutation) {
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


module.exports = function (grunt) {
  grunt.registerMultiTask('mutationTest', 'Test your tests by mutate the code.', function () {
    var opts = this.options();
    var done = this.async();

    var q = qq();

    this.files.forEach(function (file) {
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

        function logMutation(mutationPos) {
          if (file.dest === 'LOG') {
            grunt.log.writeln('\n' + mutationPos);
            return;
          }
          if (!grunt.file.exists(file.dest)) {
            grunt.file.write(file.dest, '');
          }
          fs.appendFileSync(file.dest, mutationPos + '\n');
        }

        function log(msg) {
          grunt.log.write(msg);
        }

        var q2 = qq();
        validFiles.forEach(function (file) {
          q2 = q2.then(function () {
            return mutationTestFile(path.resolve(file), runTests, logMutation, log);
          });
        });

        return q2;
      });
    });
    q.done(done);
  });
};
