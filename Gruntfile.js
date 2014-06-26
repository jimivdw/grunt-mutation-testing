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

  var runner = require('karma').runner;
  var server = require('karma').server;
  var path = require('path');

  var requireUncache = require('require-uncache');

  // load all npm grunt tasks
  require('load-grunt-tasks')(grunt);

  // Project configuration.
  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/*.js'
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
    mutationTest: {
      flagAllMutations: {
        options: {
          test: function (done) {
            done(true);
          }
        },
        files: {
          //'tmp/report.txt': ['test/fixtures/script*.js']
          'tmp/flag-all-mutations.txt': ['test/fixtures/mocha/script*.js']
        }
      },
      mocha: {
        options: {
          test: function (done) {
            //https://github.com/visionmedia/mocha/wiki/Third-party-reporters
            var mocha = new Mocha({reporter: function (runner) {
              //dummyReporter
            }});

            mocha.suite.on('pre-require', function (context, file) {
              requireUncache(file);
            });

            mocha.addFile('test/fixtures/mocha/mocha-test.js');
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
          'tmp/mocha.txt': ['test/fixtures/mocha/script*.js']
        }
      },
      karma: {
        options: {
          test: function (done) {
            runner.run({}, function (numberOfCFailingTests) {
              done(numberOfCFailingTests === 0);
            });
          }
        },
        files: {
          'tmp/karma.txt': ['test/fixtures/karma-mocha/script*.js']
        }
      }
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
        src: ['test/fixtures/mocha/*-test.js']
      },
      itest: {
        options: {
          reporter: 'spec'
        },
        src: ['test/**/*-itest.js']
      }
    },

    karma: {
      options: {
        configFile: 'test/fixtures/karma-mocha/karma.conf.js'
      },
      fixtures: {
        singleRun: true,
        browsers: ['PhantomJS']
      }
    },

    shell: {
      stopKarmaPhantomJS: {
        command: 'killall phantomjs'
      }
    }
  });

  grunt.task.registerTask('startKarma', 'Starts Karma for mutation testing', function () {
    var done = this.async();
    server.start({
      background: false,
      singleRun: false,
      browsers: ['PhantomJS'],
      reporters: [],
      logLevel: 'OFF',
      autoWatch: false,
      configFile: path.resolve('test/fixtures/karma-mocha/karma.conf.js')
    });
    // Better: https://github.com/karma-runner/karma/issues/1037
    // https://github.com/karma-runner/karma/issues/535
    setTimeout(function () {
      done();
    }, 2000);
    // Stopping is also an problem
    // https://github.com/karma-runner/karma/issues/509
    // https://github.com/karma-runner/karma/issues/136
    // killall phantomjs

  });

  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-shell');

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  grunt.registerTask('mutationTestKarma', ['startKarma','mutationTest:karma']);

  grunt.registerTask('test', [
    'clean',
    'mochaTest:fixtures',
    'karma',
    'mutationTest:flagAllMutations',
    'mutationTest:mocha',
    'mutationTestKarma',
    'mochaTest:itest',
    'shell:stopKarmaPhantomJS'
  ]);

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test']);

};
