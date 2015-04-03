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
    q = require('q'),
    xml2js = require('xml2js');

var CopyUtils = require('../utils/CopyUtils'),
    IOUtils = require('../utils/IOUtils');

exports.init = function(grunt, opts) {
    if(opts.testFramework !== 'karma') {
        return;
    }

    var runner = require('karma').runner,
        backgroundProcesses = [],
        karmaConfig,
        karmaConfigOrig,
        fileSpecs = {},
        coverageFile,
        baseCoverage = {},
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

    function getCoverage(files) {
        var deferred = q.defer();

        karmaConfig.files = files;
        startServer(function() {
            opts.test(function() {
                getFileLineCoverage(coverageFile).then(function(fileLineCoverage) {
                    stopServer();
                    deferred.resolve(fileLineCoverage);
                }, function(error) {
                    deferred.reject(error);
                });
            });
        });

        return deferred.promise;
    }

    function parseCoverage(xmlData) {
        var deferred = q.defer();
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
        var deferred = q.defer(),
            fileLineCoverage = {};

        try {
            IOUtils.readFileEventually(coverageFile, karmaConfig.waitForServerTime * 1000).done(function(xmlData) {
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

    function setKarmaCoverageConfig() {
        karmaConfigOrig = _.extend({}, karmaConfig);
        karmaConfig = _.extend(karmaConfig, {
            reporters: ['coverage'],
            preprocessors: _.zipObject(_.map(opts.mutate, function(file) {
                return [file, 'coverage'];
            })),
            coverageReporter: {
                type: 'cobertura',
                dir: 'coverage',
                subdir: '.',
                file: 'coverage.xml'
            }
        });

        coverageFile = path.join(karmaConfig.basePath, karmaConfig.coverageReporter.dir,
            karmaConfig.coverageReporter.file);
    }

    function resetKarmaConfig() {
        karmaConfig = karmaConfigOrig;
    }

    function findCodeSpecs() {
        var deferred = q.defer(),
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
            // Configure Karma for collecting coverage data
            setKarmaCoverageConfig();

            getCoverage(opts.code).done(function(coverage) {
                baseCoverage = coverage;

                var specCoveragePromise = new q();
                _.forEach(opts.specs, function(specFile) {
                    specCoveragePromise = specCoveragePromise.then(function() {
                        var deferred = q.defer();
                        fs.unlinkSync(coverageFile);
                        getCoverage(opts.code.concat(specFile)).then(function(specCoverage) {
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
                        return deferred.promise;
                    });
                });

                specCoveragePromise.then(function() {
                    resetKarmaConfig();

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
