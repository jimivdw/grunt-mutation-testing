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

var CopyUtils = require('../utils/CopyUtils'),
    IOUtils = require('../utils/IOUtils'),
    KarmaServerPool = require('../lib/karma/KarmaServerPool'),
    KarmaCodeSpecsMatcher = require('../lib/karma/KarmaCodeSpecsMatcher');

exports.init = function(grunt, opts) {
    if(opts.testFramework !== 'karma') {
        return;
    }

    var karmaConfig = _.extend(
            {
                // defaults, but can be overwritten
                basePath: path.resolve('.'),
                reporters: []
            },
            opts.karma,
            {
                // can't be overwritten, because important for us
                background: false,
                singleRun: false,
                autoWatch: false
            }
        ),
        serverPool = new KarmaServerPool({maxActiveServers: karmaConfig.maxActiveServers, startInterval: karmaConfig.startInterval}),
        currentInstance,
        fileSpecs = {};

    // Extend the karma configuration with some secondary properties that cannot be overwritten
    _.merge(karmaConfig, {
        logLevel: ['INFO', 'DEBUG'].indexOf(karmaConfig.logLevel) !== -1 ? karmaConfig.logLevel : 'INFO',
        configFile: karmaConfig.configFile ? path.resolve(karmaConfig.configFile) : undefined
    });

    function startServer(config, callback) {
        serverPool.startNewInstance(config).done(function(instance) {
            callback(instance);
        });
    }

    function stopServers() {
        serverPool.killAllInstances();
    }

    opts.before = function(doneBefore) {
        function finalizeBefore(callback) {
            new KarmaCodeSpecsMatcher(serverPool, _.merge({}, opts, { karma: karmaConfig }))
                .findCodeSpecs().then(function(codeSpecs) {
                    fileSpecs = codeSpecs;
                    callback();
                });
        }

        if(!opts.mutateProductionCode) {
            CopyUtils.copyToTemp(opts.code.concat(opts.specs), 'mutation-testing').done(function(tempDirPath) {
                // Set the basePath relative to the temp dir
                karmaConfig.basePath = tempDirPath;
                opts.basePath = path.join(tempDirPath, opts.basePath);

                // Set the paths to the files to be mutated relative to the temp dir
                opts.mutate = _.map(opts.mutate, function(file) {
                    return path.join(tempDirPath, file);
                });

                finalizeBefore(doneBefore);
            });
        } else {
            finalizeBefore(doneBefore);
        }

        process.on('exit', function() {
            stopServers();
        });
    };

    opts.beforeEach = function(done) {
        var currentFileSpecs;

        // Find the specs for the current mutation file
        currentFileSpecs = _.find(fileSpecs, function(specs, file) {
            return IOUtils.normalizeWindowsPath(opts.currentFile).indexOf(file) !== -1;
        });

        karmaConfig.files = _.union(opts.code, currentFileSpecs);

        startServer(karmaConfig, function(instance) {
            currentInstance = instance;
            done();
        });
    };

    opts.test = function(done) {
        currentInstance.runTests().then(function(testSuccess) {
            done(testSuccess);
        }, function(error) {
            grunt.log.warn('\n' + error);
            startServer(karmaConfig, function(instance) {
                currentInstance = instance;
                done(false);
            });
        });
    };

    opts.afterEach = function(done) {
        // Kill the currently active instance
        currentInstance.stop();

        done();
    };

    opts.after = function() {
        stopServers();
    };
};
