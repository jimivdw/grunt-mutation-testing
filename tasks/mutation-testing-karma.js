/**
 * mutation-testing-karma
 *
 * @author Marco Stahl
 * @author Jimi van der Woning
 * @author Martin Koster
 */
'use strict';
var _ = require('lodash'),
    path = require('path'),
    KarmaServerManager = require('../lib/KarmaServerManager');
var Q = require('q');

var CopyUtils = require('../utils/CopyUtils');

exports.init = function(grunt, opts) {
    if(opts.testFramework !== 'karma') {
        return;
    }

    var runner = require('karma').runner,
        start = Date.now(),
        backgroundProcesses = [],
        serverInstance,
        karmaConfig,
        fileSpecs = {},
        port = 12111,
        karmaServerManager = new KarmaServerManager(port);

    opts.before = function(doneBefore) {
        karmaConfig = _.extend(
            {
                // defaults, but can be overwritten
                reporters: [],
                logLevel: 'INFO',
                waitForServerTime: 5
            },
            opts.karma,
            {
                // can't be overwritten, because important for us
                configFile: opts.karma && opts.karma.configFile ? path.resolve(opts.karma.configFile) : undefined,
                background: false,
                singleRun: false,
                autoWatch: false
            }
        );
        //overwrite the loglevel with INFO if it's set to anything stricter as we need the karma log to determine whether the server has started
        karmaConfig.logLevel = karmaConfig.logLevel === 'DEBUG' || karmaConfig.logLevel === 'TRACE' ? karmaConfig.logLevel : 'INFO';

        // Find which files are used in the unit test
        karmaConfig.files = opts.code.concat(opts.specs);
        karmaServerManager.setKarmaConfig(karmaConfig);

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
                    return {orig: file, temp: path.join(tempDirPath, file)};
                });

                doneBefore();
            });
        } else {
            doneBefore();
        }

        process.on('exit', function() {
            karmaServerManager.killAllServerInstances();
        });
    };

    opts.beforeEach = function(done) {
        var currentFileSpecs;

        // Kill old server processes (from previous runs) and start new ones with new karma configuration
        karmaServerManager.killAllServerInstances();
        new Q({})
            .then(function(){
                // Find the specs for the current mutation file
                currentFileSpecs = _.find(fileSpecs, function(specs, file) {
                    return opts.currentFile.replace(/\\/g, '/').indexOf(file) !== -1;
                });

                karmaConfig.files = opts.code.concat(currentFileSpecs || []);
                karmaServerManager.setKarmaConfig(karmaConfig);
                karmaServerManager.initServers(3);
                return karmaServerManager.getServerInstance();
            }).done(function(instance){
                console.log('retrieving instance', instance.port);
                serverInstance = instance;
                done();
            });
    };

    opts.test = function(done) {
        setTimeout(function() {
            runner.run(
                _.merge(karmaConfig, { port: serverInstance.port }),
                function(exitCode) {
                    clearTimeout(timer);
                    done(exitCode === 0);
                }
            );

            var timer = setTimeout(
                function() {
                    grunt.log.warn('\nWarning! Infinite loop detected in process ' + serverInstance.process.pid + '. This may put a strain on your CPU.');
                    karmaServerManager.invalidateServerInstance(serverInstance);
                    karmaServerManager.startServerInstance();
                    karmaServerManager.getServerInstance()
                        .then(function(instance){
                            serverInstance = instance;
                            return karmaServerManager.killExpiredServerInstances();
                        })
                    .then(function(instance){
                            done('infiniteLoop');
                        });
                }, 2000
            );
        }, 100);
    };

    opts.after = function(done) {
        console.log('karma mutation tests ran for ' + (Date.now() - start) + 'ms');
        karmaServerManager.killAllServerInstances().then(done);
    };
};
