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
    KarmaServerManager = require('../lib/KarmaServerManager');

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
        configFile: karmaConfig.configFile ? path.resolve(karmaConfig.configFile) : undefined,
        coverageDir: path.join(karmaConfig.basePath, 'coverage')
    });

    function startServer(config, callback) {
        serverManager.startNewInstance(config).done(function(instance) {
            callback(instance);
        });
    }

    function stopServers() {
        serverManager.killAllInstances();
    }

    function getSpecFileCoverage(specFile) {
        var deferred = Q.defer(),
            files = specFile ? opts.code.concat(specFile) : opts.code,
            config = _.merge({}, karmaConfig, { files: files }, {
                reporters: ['coverage'],
                preprocessors: _.zipObject(_.map(opts.mutate, function(file) {
                    return [file, 'coverage'];
                })),
                coverageReporter: {
                    type: 'cobertura',
                    dir: karmaConfig.coverageDir,
                    subdir: '.',
                    file: (specFile ? specFile : 'dummy') + 'coverage.xml'
                }
            }),
            coverageFile = path.join(config.coverageReporter.dir, config.coverageReporter.file);

        startServer(config, function(instance) {
            instance.runTests().done(function() {
                parseXMLCoverageFile(coverageFile).then(function(fileLineCoverage) {
                    instance.kill();
                    deferred.resolve(fileLineCoverage);
                }, function(error) {
                    deferred.reject(error);
                });
            });
        });

        return deferred.promise;
    }

    function parseXMLCoverageData(xmlCoverageData) {
        var deferred = Q.defer(),
            fileLineCoverage = {};

        xml2js.parseString(xmlCoverageData, function(error, coverageData) {
            if(error) {
                console.warn('Error', error);
                deferred.reject(error);
            } else {
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
            }
        });

        return deferred.promise;
    }

    function parseXMLCoverageFile(xmlCoverageFile) {
        var deferred = Q.defer();

        try {
            IOUtils.readFileEventually(xmlCoverageFile, 5000).done(function(xmlData) {
                deferred.resolve(parseXMLCoverageData(xmlData));
            });
        } catch(error) {
            console.warn("Error", error);
            deferred.reject(error);
        }

        return deferred.promise;
    }

    function findCodeSpecs() {
        var deferred = Q.defer(),
            codeSpecs = {};

        function getRelativeFilePath(filePath) {
            var basePath = IOUtils.normalizeWindowsPath(_.last(opts.basePath.split(karmaConfig.basePath))).slice(1);
            return _.last(IOUtils.normalizeWindowsPath(filePath).split(basePath));
        }

        function getAbsoluteSpecPaths(codeSpecs) {
            var absoluteCodeSpecs = {};
            _.forOwn(codeSpecs, function(specs, code) {
                absoluteCodeSpecs[code] = _.map(specs, function(spec) {
                    return path.join(opts.basePath, spec);
                });
            });
            return absoluteCodeSpecs;
        }

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
                    return getRelativeFilePath(spec);
                });
            });

            deferred.resolve(getAbsoluteSpecPaths(codeSpecs));
        } else {
            getSpecFileCoverage().done(function(coverage) {
                var baseCoverage = coverage,
                    specCoveragePromises = [];

                _.forEach(opts.specs, function(specFile) {
                    var deferred = Q.defer();

                    getSpecFileCoverage(specFile).then(function(specCoverage) {
                        _.forOwn(specCoverage, function(coverage, file) {
                            var relativeFile = getRelativeFilePath(file),
                                relativeSpecFile = getRelativeFilePath(specFile);

                            if(coverage > baseCoverage[file]) {
                                codeSpecs[relativeFile] = _.union(codeSpecs[relativeFile], [relativeSpecFile]);
                            }
                        });

                        deferred.resolve(specCoverage);
                    }, function(error) {
                        deferred.reject(error);
                    });

                    specCoveragePromises.push(deferred.promise);
                });

                Q.all(specCoveragePromises).then(function() {
                    grunt.log.writeln("Found pairs of code files and specs:\n" + JSON.stringify(codeSpecs, null, 2));

                    if(opts.mutateProductionCode) {
                        // Remove the coverage files
                        fs.remove(karmaConfig.coverageDir);
                    }

                    deferred.resolve(getAbsoluteSpecPaths(codeSpecs));
                }, function(error) {
                    deferred.reject(error);
                });
            });
        }

        return deferred.promise;
    }

    opts.before = function(doneBefore) {
        function finalizeBefore(callback) {
            findCodeSpecs().then(function(codeSpecs) {
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
