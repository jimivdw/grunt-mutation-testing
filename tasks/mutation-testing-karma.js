/**
 * mutation-testing-karma
 *
 * @author Marco Stahl
 * @author Jimi van der Woning
 * @author Martin Koster
 */
'use strict';
var _ = require('lodash'),
    log4js = require('log4js'),
    path = require('path');

var CopyUtils = require('../utils/CopyUtils'),
    IOUtils = require('../utils/IOUtils'),
    TestStatus = require('../lib/TestStatus'),
    KarmaServerPool = require('../lib/karma/KarmaServerPool'),
    KarmaCodeSpecsMatcher = require('../lib/karma/KarmaCodeSpecsMatcher');

var logger = log4js.getLogger('mutation-testing-karma');

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
        serverPool = new KarmaServerPool({port: karmaConfig.port, maxActiveServers: karmaConfig.maxActiveServers, startInterval: karmaConfig.startInterval}),
        currentInstance,
        fileSpecs = {};

    // Extend the karma configuration with some secondary properties that cannot be overwritten
    _.merge(karmaConfig, {
        logLevel: ['INFO', 'DEBUG', 'TRACE', 'ALL'].indexOf(karmaConfig.logLevel) !== -1 ? karmaConfig.logLevel : 'INFO',
        configFile: karmaConfig.configFile ? path.resolve(karmaConfig.configFile) : undefined
    });

    function startServer(config, callback) {
        serverPool.startNewInstance(config).done(function(instance) {
            callback(instance);
        });
    }

    function stopServers() {
        serverPool.stopAllInstances();
    }

    opts.before = function(doneBefore) {
        function finalizeBefore(callback) {
            new KarmaCodeSpecsMatcher(serverPool, _.merge({}, opts, { karma: karmaConfig }))
                .findCodeSpecs().then(function(codeSpecs) {
                    fileSpecs = codeSpecs;
                    callback();
                }, function(error) {
                    logger.warn('Code could not be automatically matched with specs: %s', error.message);
                    logger.warn(
                        'It is still possible to manually provide the code-specs mappings. As a fallback, all tests ' +
                        'will be run against all code'
                    );

                    _.forEach(opts.code, function(codeFile) {
                        fileSpecs[codeFile] = opts.specs;
                    });
                    logger.debug('Using code-specs mappings: %j', fileSpecs);
                    callback();
                });
        }

        if(!opts.mutateProductionCode) {
            CopyUtils.copyToTemp(opts.code.concat(opts.specs), 'mutation-testing').done(function(tempDirPath) {
                logger.trace('Copied %j to %s', opts.code.concat(opts.specs), tempDirPath);

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

        if(currentFileSpecs && currentFileSpecs.length) {
            karmaConfig.files = _.union(opts.code, currentFileSpecs);

            startServer(karmaConfig, function(instance) {
                currentInstance = instance;
                done(true);
            });
        } else {
            logger.warn('Could not find specs for file: %s', path.resolve(opts.currentFile));
            done(false);
        }
    };

    opts.test = function(done) {
        if(currentInstance) {
            currentInstance.runTests().then(function(testStatus) {
                done(testStatus);
            }, function(error) {
                logger.warn(error.message);
                if(error.severity === 'fatal') {
                    logger.error('Fatal: Unfortunately the mutation test cannot recover from this error and will shut down');

                    stopServers();
                    currentInstance.kill();

                    done(TestStatus.FATAL);
                } else {
                    startServer(karmaConfig, function(instance) {
                        currentInstance = instance;
                        done(TestStatus.ERROR);
                    });
                }
            });
        } else {
            logger.warn('No Karma server was present to run the tests');
            startServer(karmaConfig, function(instance) {
                currentInstance = instance;
                done(TestStatus.ERROR);
            });
        }
    };

    opts.afterEach = function(done) {
        if(currentInstance) {
            // Kill the currently active instance
            currentInstance.stop();
            currentInstance = null;
        }

        done();
    };

    opts.after = function() {
        stopServers();
    };
};
