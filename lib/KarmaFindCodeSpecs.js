/**
 * KarmaFindCodeSpecs
 *
 * @author Jimi van der Woning
 */
'use strict';

var _ = require('lodash'),
    fs = require('fs-extra'),
    path = require('path'),
    Q = require('q'),
    xml2js = require('xml2js');

var IOUtils = require('../utils/IOUtils');

function getCoverageDir(karmaConfig) {
    return path.join(karmaConfig.basePath, 'coverage');
}

function getSpecFileCoverage(opts, serverManager, karmaConfig, specFile) {
    var deferred = Q.defer(),
        files = specFile ? opts.code.concat(specFile) : opts.code,
        config = _.merge({}, karmaConfig, { files: files }, {
            reporters: ['coverage'],
            preprocessors: _.zipObject(_.map(opts.mutate, function(file) {
                return [file, 'coverage'];
            })),
            coverageReporter: {
                type: 'cobertura',
                dir: getCoverageDir(karmaConfig),
                subdir: '.',
                file: (specFile ? specFile : 'dummy') + 'coverage.xml'
            }
        }),
        coverageFile = path.join(config.coverageReporter.dir, config.coverageReporter.file);

    serverManager.startNewInstance(config).done(function(instance) {
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
            coverageData.coverage['packages'].forEach(function(pkgs) {
                pkgs['package'].forEach(function(pkg) {
                    pkg['classes'].forEach(function(clss) {
                        clss['class'].forEach(function(cls) {
                            var fileName = IOUtils.normalizeWindowsPath(cls.$['filename']);
                            fileLineCoverage[fileName] = Number(cls.$['line-rate']);
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

function findCodeSpecs(opts, serverManager, karmaConfig) {
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
        _.forEach(opts.mutate, function(mutateFile) {
            mutateFile = IOUtils.normalizeWindowsPath(mutateFile);
            var mutateFileSpecs = _.find(karmaConfig.fileSpecs, function(specs, file) {
                return mutateFile.indexOf(IOUtils.normalizeWindowsPath(file)) !== -1;
            });

            codeSpecs[mutateFile] = mutateFileSpecs || _.map(opts.specs, function(spec) {
                return getRelativeFilePath(spec);
            });
        });

        deferred.resolve(getAbsoluteSpecPaths(codeSpecs));
    } else {
        getSpecFileCoverage(opts, serverManager, karmaConfig).done(function(coverage) {
            var baseCoverage = coverage,
                specCoveragePromises = [];

            _.forEach(opts.specs, function(specFile) {
                var deferred = Q.defer();

                getSpecFileCoverage(opts, serverManager, karmaConfig, specFile).then(function(specCoverage) {
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
                console.log("Found pairs of code files and specs:\n" + JSON.stringify(codeSpecs, null, 2));

                // Remove the coverage files when mutating production code
                if(opts.mutateProductionCode) {
                    fs.remove(getCoverageDir(karmaConfig));
                }

                deferred.resolve(getAbsoluteSpecPaths(codeSpecs));
            }, function(error) {
                deferred.reject(error);
            });
        });
    }

    return deferred.promise;
}

module.exports = findCodeSpecs;
