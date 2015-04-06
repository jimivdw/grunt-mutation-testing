/**
 * mutation-testing-karma
 *
 * @author Marco Stahl
 * @author Jimi van der Woning
 * @author Martin Koster
 */
'use strict';
var _ = require('lodash'),
    fs = require('fs-extra'),
    path = require('path'),
    Q = require('q'),
    xml2js = require('xml2js');

var CopyUtils = require('../utils/CopyUtils'),
    IOUtils = require('../utils/IOUtils'),
    KarmaServerManager = require('../lib/KarmaServerManager'),
    findCodeSpecs = require('../lib/KarmaFindCodeSpecs');

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
        serverManager = new KarmaServerManager(karmaConfig),
        fileSpecs = {};

    // Extend the karma configuration with some secondary properties that cannot be overwritten
    _.merge(karmaConfig, {
        logLevel: ['INFO', 'DEBUG'].indexOf(karmaConfig.logLevel) !== -1 ? karmaConfig.logLevel : 'INFO',
        configFile: karmaConfig.configFile ? path.resolve(karmaConfig.configFile) : undefined
    });

    function startServer(config, callback) {
        serverManager.startNewInstance(config).done(function(instance) {
            callback(instance);
        });
    }

    function stopServers() {
        serverManager.killAllInstances();
    }

    opts.before = function(doneBefore) {
        function finalizeBefore(callback) {
            findCodeSpecs(opts, serverManager, karmaConfig).then(function(codeSpecs) {
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
            opts.currentInstance = instance;
            done();
        });
    };

    opts.test = function(done) {
        opts.currentInstance.runTests().then(function(testSuccess) {
            done(testSuccess);
        }, function(error) {
            grunt.log.warn('\n' + error);
            startServer(karmaConfig, function(instance) {
                opts.currentInstance = instance;
                done(false);
            });
        });
    };

    opts.afterEach = function(done) {
        opts.currentInstance.kill();
        done();
    };

    opts.after = function() {
        stopServers();
    };
};
