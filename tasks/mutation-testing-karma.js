/**
 * mutation-testing-karma
 *
 * @author Marco Stahl
 * @author Jimi van der Woning
 * @author Martin Koster
 */
'use strict';
var _ = require('lodash'),
    path = require('path');

var CopyUtils = require('../utils/CopyUtils');

exports.init = function(grunt, opts) {
    if(opts.testFramework !== 'karma') {
        return;
    }

    var runner = require('karma').runner,
        backgroundProcesses = [],
        karmaConfig,
        fileSpecs = {},
        port = 12111;

    function startServer(startCallback) {
        port = port + 1;
        karmaConfig.port = port;

        grunt.log.write('\nStarting a Karma server on port ' + port + '...');

        // FIXME: nasty fallback in case of infinite looping owing to code mutations. At least make it non-blocking
        backgroundProcesses.push(
            grunt.util.spawn(
                {
                    cmd: 'node',
                    args: [
                        path.join(__dirname, '..', 'lib', 'run-karma-in-background.js'),
                        JSON.stringify(karmaConfig)
                    ]
                }, function() {
                }
            )
        );

        setTimeout(
            function() {
                grunt.log.write('Done\n');
                startCallback();
            }, karmaConfig.waitForServerTime * 1000
        );
    }

    function stopServer() {
        backgroundProcesses.forEach(function(bgProcess) {
            bgProcess.kill();
        });
        backgroundProcesses = [];
    }

    opts.before = function(doneBefore) {
        karmaConfig = _.extend(
            {
                // defaults, but can be overwritten
                reporters: [],
                logLevel: 'OFF',
                waitForServerTime: 5
            },
            opts.karma,
            {
                // can't be overwritten, because important for us
                configFile: opts.karma && opts.karma.configFile ? path.resolve(opts.karma.configFile) : undefined,
                background: false,
                singleRun: false,
                autoWatch: false,
                port: port
            }
        );

        // Find which files are used in the unit test
        karmaConfig.files = opts.code.concat(opts.specs);

        // Create a mapping from source code to its specs, or to all specs when not explicitly provided
        _.forEach(opts.mutate, function(file) {
            var mutateFileSpecs = _.find(karmaConfig.fileSpecs, function(fsSpecs, fsFile) {
                return file.indexOf(fsFile) !== -1;
            });

            if(mutateFileSpecs) {
                fileSpecs[file] = _.map(mutateFileSpecs, function(mfsSpec) {
                    return path.join(opts.basePath, mfsSpec);
                });
            } else {
                fileSpecs[file] = opts.specs;
            }
        });

        if(!opts.mutateProductionCode) {
            CopyUtils.copyToTemp(karmaConfig.files, 'mutation-testing').done(function(tempDirPath) {
                // Set the basePath relative to the temp dir
                karmaConfig.basePath = tempDirPath;
                opts.basePath = path.join(tempDirPath, opts.basePath);

                // Set the paths to the files to be mutated relative to the temp dir
                opts.mutate = _.map(opts.mutate, function(file) {
                    return path.join(tempDirPath, file);
                });

                doneBefore();
            });
        } else {
            doneBefore();
        }

        process.on('exit', function() {
            stopServer();
        });
    };

    opts.beforeEach = function(done) {
        var currentFileSpecs;

        // Kill old server processes (from previous runs)
        if(backgroundProcesses.length > 0) {
            stopServer();
        }

        // Find the specs for the current mutation file
        currentFileSpecs = _.find(fileSpecs, function(specs, file) {
            return opts.currentFile.replace(/\\/g, '/').indexOf(file) !== -1;
        });

        karmaConfig.files = opts.code.concat(currentFileSpecs || []);

        startServer(done);
    };

    opts.test = function(done) {
        setTimeout(function() {
            runner.run(
                _.merge(karmaConfig, { port: port }),
                function(exitCode) {
                    clearTimeout(timer);
                    done(exitCode === 0);
                }
            );

            var timer = setTimeout(
                function() {
                    grunt.log.warn('\nWarning! Infinite loop detected. This may put a strain on your CPU.');
                    startServer(function() {
                        done(false);
                    });
                }, 2000
            );
        }, 100);
    };

    opts.after = function() {
        stopServer();
    };
};
