/**
 * mutation-testing-karma
 *
 * @author Marco Stahl
 * @author Jimi van der Woning
 * @author Martin Koster
 */
'use strict';
var _ = require('lodash'),
    fs = require('fs'),
    path = require('path'),
    Q = require('q'),
    xml2js = require('xml2js');

var CopyUtils = require('../utils/CopyUtils'),
    IOUtils = require('../utils/IOUtils'),
    KarmaServer = require('../lib/KarmaServer');

exports.init = function(grunt, opts) {
    if(opts.testFramework !== 'karma') {
        return;
    }

    var karmaServers = [],
        karmaConfig,
        karmaConfigOrig,
        fileSpecs = {},
        baseCoverage = {},
        port = 12111;

    function startServer(config, callback) {
        var server = new KarmaServer(config, port++);
        karmaServers.push(server);
        server.start().done(function(instance) {
            callback(instance);
        });
    }

    function stopServers() {
        karmaServers.forEach(function(instance) {
            instance.kill();
        });
        karmaServers = [];
    }

    function getCoverage(specFile) {
        var deferred = Q.defer(),
            files = specFile ? opts.code.concat(specFile) : opts.code,
            config = _.merge({}, karmaConfig, { files: files }, {
                reporters: ['coverage'],
                preprocessors: _.zipObject(_.map(opts.mutate, function(file) {
                    return [file, 'coverage'];
                })),
                coverageReporter: {
                    type: 'cobertura',
                    dir: 'coverage',
                    subdir: '.',
                    file: (specFile ? specFile : 'dummy') + 'coverage.xml'
                }
            }),
            coverageFile = path.join(config.basePath, config.coverageReporter.dir, config.coverageReporter.file);

        startServer(config, function(instance) {
            instance.runTests().done(function() {
                getFileLineCoverage(coverageFile).then(function(fileLineCoverage) {
                    instance.kill();
                    deferred.resolve(fileLineCoverage);
                }, function(error) {
                    deferred.reject(error);
                });
            });
        });

        return deferred.promise;
    }

    function parseCoverage(xmlData) {
        var deferred = Q.defer();
        xml2js.parseString(xmlData, function(err, data) {
            if(err) {
                console.warn('Error', err);
                deferred.reject(err);
            } else {
                deferred.resolve(data);
            }
        });
        return deferred.promise;
    }

    function stripOffBasePath(fileName) {
        var basePath = IOUtils.normalizeWindowsPath(_.last(opts.basePath.split(karmaConfig.basePath))).slice(1);
        return _.last(IOUtils.normalizeWindowsPath(fileName).split(basePath));
    }

    function getFileLineCoverage(coverageFile) {
        var deferred = Q.defer(),
            fileLineCoverage = {};

        try {
            IOUtils.readFileEventually(coverageFile, 5000).done(function(xmlData) {
                parseCoverage(xmlData).done(function(coverageData) {
                    coverageData.coverage.packages.forEach(function(pkgs) {
                        pkgs['package'].forEach(function(pkg) {
                            pkg.classes.forEach(function(clss) {
                                clss['class'].forEach(function(cls) {
                                    var fileName = IOUtils.normalizeWindowsPath(cls.$['filename']),
                                        lineCoverage = Number(cls.$['line-rate']);
                                    fileLineCoverage[fileName] = lineCoverage;
                                });
                            });
                        });
                    });

                    deferred.resolve(fileLineCoverage);
                });
            });
        } catch(err) {
            console.warn("Error", err);
            deferred.reject(err);
        }

        return deferred.promise;
    }

    function findCodeSpecs() {
        var deferred = Q.defer(),
            codeSpecs = {};

        if(karmaConfig.fileSpecs) {
            if(_.isString(karmaConfig.fileSpecs)) {
                try {
                    karmaConfig.fileSpecs = JSON.parse(fs.readFileSync(karmaConfig.fileSpecs));
                } catch(error) {
                    deferred.reject(error);
                    return deferred.promise;
                }
            }

            // Create a mapping from source code to its specs, or to all specs when not explicitly provided
            _.forEach(opts.mutate, function(file) {
                file = IOUtils.normalizeWindowsPath(file);
                var mutateFileSpecs = _.find(karmaConfig.fileSpecs, function(fsSpecs, fsFile) {
                    return file.indexOf(IOUtils.normalizeWindowsPath(fsFile)) !== -1;
                });

                codeSpecs[file] = mutateFileSpecs || _.map(opts.specs, function(spec) {
                    return stripOffBasePath(spec);
                });
            });

            deferred.resolve(codeSpecs);
        } else {
            getCoverage().done(function(coverage) {
                baseCoverage = coverage;

                var specCoveragePromises = [];
                _.forEach(opts.specs, function(specFile) {
                    var deferred = Q.defer();

                    getCoverage(specFile).then(function(specCoverage) {
                        _.forOwn(specCoverage, function(coverage, file) {
                            var relativeFile = stripOffBasePath(file),
                                relativeSpecFile = stripOffBasePath(specFile);
                            if(coverage > baseCoverage[file]) {
                                if(codeSpecs[relativeFile]) {
                                    codeSpecs[relativeFile].push(relativeSpecFile);
                                } else {
                                    codeSpecs[relativeFile] = [relativeSpecFile];
                                }
                            }
                        });
                        deferred.resolve(specCoverage);
                    }, function(error) {
                        deferred.reject(error);
                    });

                    specCoveragePromises.push(deferred.promise);
                });

                Q.all(specCoveragePromises).then(function() {
                    deferred.resolve(codeSpecs);
                }, function(error) {
                    deferred.reject(error);
                });
            });
        }

        return deferred.promise;
    }

    opts.before = function(doneBefore) {
        karmaConfig = _.extend(
            {
                // defaults, but can be overwritten
                basePath: '.',
                reporters: [],
                logLevel: 'INFO'
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

        function finalizeBefore(callback) {
            findCodeSpecs().then(function(codeSpecs) {
                grunt.log.writeln("Found pairs of code files and specs:\n", JSON.stringify(codeSpecs, null, 2));
                _.forEach(codeSpecs, function(specs, code) {
                    fileSpecs[code] = _.map(specs, function(spec) {
                        return path.join(opts.basePath, spec);
                    });
                });
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
            return opts.currentFile.replace(/\\/g, '/').indexOf(file) !== -1;
        });

        karmaConfig.files = opts.code.concat(currentFileSpecs || []);

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
