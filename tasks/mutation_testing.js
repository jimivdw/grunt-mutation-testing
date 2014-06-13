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

/**
 * @param {string} srcFilename
 * @param {function} runTests
 * @param {function} logMutation
 */
function mutationTestFile(srcFilename, runTests, logMutation, log) {
  var src = fs.readFileSync(srcFilename, 'UTF8');
  var ast = esprima.parse(src, {range: true, loc: true});

  //fs.writeFileSync('ast.temp.json', JSON.stringify(ast, null, 4));

  function forEachMutation(astNode, fun) {
    if (astNode.type === 'ExpressionStatement' && astNode.expression.type === 'CallExpression' && astNode.expression.arguments) {
      astNode.expression.arguments.forEach(function (argumentNode) {
        forEachMutation(argumentNode, fun);
      });
      return;
    }

    var body = astNode.body;

    if (!body) {
      return;
    }

    if (body.type === 'BlockStatement') {
      body = body.body;
    }

    body.forEach(function (childNode) {
      var mutatedSrc = src.substr(0, childNode.range[0]) + src.substr(childNode.range[1]);
      var mutation = {
        mutatedSrc: mutatedSrc,
        line: childNode.loc.start.line,
        col: childNode.loc.start.column
      };
      fun(mutation);
      forEachMutation(childNode, fun);
    });

  }

  try {
    log('\nMutating file ' + srcFilename + '\n');
    forEachMutation(ast, function (mutation) {
      var currentMutationPosition = srcFilename + ':' + mutation.line + ':' + (mutation.col + 1);
      log(mutation.line + ',');
      fs.writeFileSync(srcFilename, mutation.mutatedSrc);
      if (runTests()) {
        logMutation(currentMutationPosition + ' can be removed.');
      }
    });
  } finally {
    fs.writeFileSync(srcFilename, src);
  }
}


module.exports = function (grunt) {
  grunt.registerMultiTask('mutation_testing', 'Test your tests by mutate the code.', function () {
    var opts = this.options();

    this.files.forEach(function (file) {

      var validFiles = file.src.filter(function (filepath) {
        if (!grunt.file.exists(filepath)) {
          grunt.log.warn('Source file "' + filepath + '" not found.');
          return false;
        } else {
          return true;
        }
      });

      function runTests() {
        if (typeof opts.test === 'string') {
          var execResult = exec(opts.test);
          return  execResult.status === 0;
        } else {
          return opts.test();
        }
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

      validFiles.forEach(function (file) {
        mutationTestFile(path.resolve(file), runTests, logMutation, log);
      });

    });
  });
};
