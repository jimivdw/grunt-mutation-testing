/*
 * grunt-mutation-testing
 * 
 *
 * Copyright (c) 2014 Marco Stahl
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {
  var Mocha = require('mocha');
  var requireUncache = require('require-uncache');

  // load all npm grunt tasks
  require('load-grunt-tasks')(grunt);

  function MyReporter(runner) {
  }

  // Project configuration.
  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/*.js',
        '<%= nodeunit.tests %>'
      ],
      options: {
        jshintrc: '.jshintrc',
        reporter: require('jshint-stylish')
      }
    },

    // Before generating any new files, remove any previously-created files.
    clean: {
      tests: ['tmp']
    },

    // Configuration to be run (and then tested).
    mutation_testing: {
      toFile: {
        options: {
          test: function (done) {
            done(true);
          }
        },
        files: {
          //'tmp/report.txt': ['test/fixtures/script*.js']
          'LOG': ['test/fixtures/script*.js']
        }
      },
      mochaToFile: {
        options: {
          test: function (done) {
            //https://github.com/visionmedia/mocha/wiki/Third-party-reporters
            var mocha = new Mocha({reporter: function (runner) {
              //dummyReporter
            }});

            mocha.suite.on('pre-require', function(context, file) {
              requireUncache(file);
            });

            mocha.addFile('test/fixtures/mocha-test.js');
            try {
              mocha.run(function (errCount) {
                var withoutErrors = (errCount === 0);
                done(withoutErrors);
              });
            } catch (error) {
              done(false);
            }
          }
        },
        files: {
          //'tmp/report.txt': ['test/fixtures/script*.js']
          'LOG': ['test/fixtures/script*.js']
        }
      },
      toLog: {
        options: {
          //test: 'grunt nodeunit:fixture'
          test: 'grunt mochaTest:fixtures'
        },
        files: {
          'LOG': ['test/fixtures/script*.js']
        }
      }
    },

    // Unit tests.
    nodeunit: {
      tests: ['test/*_test.js'],
      fixture: ['test/fixtures/test.js']
    },

    mochaTest: {
      test: {
        options: {
          reporter: 'spec'
        },
        src: ['test/**/*-test.js']
      },
      fixtures: {
        options: {
          reporter: 'spec'
        },
        src: ['test/fixtures/*-test.js']
      }
    }

  });

  grunt.loadNpmTasks('grunt-mocha-test');

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');


  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  //grunt.registerTask('test', ['clean', 'mutation_testing', 'nodeunit:tests']);
  //grunt.registerTask('test', ['clean', 'mutation_testing:toFile']);
  //grunt.registerTask('test', ['mutation_testing:toFile']);
  grunt.registerTask('test', ['mutation_testing:mochaToFile']);

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test']);

};
