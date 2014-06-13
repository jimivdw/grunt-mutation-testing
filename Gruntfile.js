/*
 * grunt-mutation-testing
 * 
 *
 * Copyright (c) 2014 Marco Stahl
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {
  // load all npm grunt tasks
  require('load-grunt-tasks')(grunt);

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
        },
        files: {
          'tmp/report.txt': ['test/fixtures/script*.js']
        }
      },
      toLog: {
        options: {
          test: 'grunt nodeunit:fixture'
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
    }

  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  //grunt.registerTask('test', ['clean', 'mutation_testing', 'nodeunit:tests']);
  grunt.registerTask('test', ['clean', 'mutation_testing:toLog']);

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test']);

};
