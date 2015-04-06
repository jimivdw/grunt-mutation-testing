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


function KarmaCodeSpecsMatcher(serverManager, config) {
    this._serverManager = serverManager;
    this._config = _.merge({ karma: { waitForCoverageTime: 5 } }, config);
    this._coverageDir = path.join(config.karma.basePath, 'coverage');
}

KarmaCodeSpecsMatcher.prototype._getSpecFileCoverage = function(specFile) {
    var self = this,
        deferred = Q.defer(),
        files = specFile ? self._config.code.concat(specFile) : self._config.code,
        config = _.merge({}, self._config.karma, { files: files }, {
            reporters: ['coverage'],
            preprocessors: _.zipObject(_.map(self._config.mutate, function(file) {
                return [file, 'coverage'];
            })),
            coverageReporter: {
                type: 'cobertura',
                dir: self._coverageDir,
                subdir: '.',
                file: (specFile ? specFile : 'dummy') + 'coverage.xml'
            }
        }),
        coverageFile = path.join(config.coverageReporter.dir, config.coverageReporter.file);

    self._serverManager.startNewInstance(config).done(function(instance) {
        instance.runTests().done(function() {
            self._parseXMLCoverageFile(coverageFile).then(function(fileLineCoverage) {
                instance.kill();
                deferred.resolve(fileLineCoverage);
            }, function(error) {
                deferred.reject(error);
            });
        });
    });

    return deferred.promise;
};

KarmaCodeSpecsMatcher.prototype._parseXMLCoverageData = function(xmlCoverageData) {
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
};

KarmaCodeSpecsMatcher.prototype._parseXMLCoverageFile = function(xmlCoverageFile) {
    var self = this,
        deferred = Q.defer();

    try {
        IOUtils.readFileEventually(xmlCoverageFile, self._config.karma.waitForCoverageTime * 1000)
            .done(function(xmlData) {
                deferred.resolve(self._parseXMLCoverageData(xmlData));
            });
    } catch(error) {
        console.warn("Error", error);
        deferred.reject(error);
    }

    return deferred.promise;
};

KarmaCodeSpecsMatcher.prototype._getRelativeFilePath = function(filePath) {
    var basePath = IOUtils.normalizeWindowsPath(_.last(this._config.basePath.split(this._config.karma.basePath)))
        .slice(1);
    return _.last(IOUtils.normalizeWindowsPath(filePath).split(basePath));
};

KarmaCodeSpecsMatcher.prototype._getAbsoluteSpecPaths = function(codeSpecs) {
    var self = this,
        absoluteCodeSpecs = {};

    _.forOwn(codeSpecs, function(specs, code) {
        absoluteCodeSpecs[code] = _.map(specs, function(spec) {
            return path.join(self._config.basePath, spec);
        });
    });

    return absoluteCodeSpecs;
};

KarmaCodeSpecsMatcher.prototype._findCodeSpecsFromConfig = function() {
    var self = this,
        deferred = Q.defer(),
        codeSpecs = {},
        configFileSpecs;

    if(_.isString(self._config.karma.fileSpecs)) {
        try {
            configFileSpecs = JSON.parse(fs.readFileSync(self._config.karma.fileSpecs));
        } catch(error) {
            deferred.reject(error);
            return deferred.promise;
        }
    } else {
        configFileSpecs = self._config.karma.fileSpecs;
    }

    // Create a mapping from source code to its specs, or to all specs when not explicitly provided
    _.forEach(self._config.mutate, function(mutateFile) {
        mutateFile = IOUtils.normalizeWindowsPath(mutateFile);
        var mutateFileSpecs = _.find(configFileSpecs, function(specs, file) {
            return mutateFile.indexOf(IOUtils.normalizeWindowsPath(file)) !== -1;
        });

        codeSpecs[mutateFile] = mutateFileSpecs || _.map(self._config.specs, function(spec) {
            return self._getRelativeFilePath(spec);
        });
    });

    deferred.resolve(self._getAbsoluteSpecPaths(codeSpecs));

    return deferred.promise;
};

KarmaCodeSpecsMatcher.prototype._findCodeSpecsUsingCoverage = function() {
    var self = this,
        deferred = Q.defer(),
        codeSpecs = {};

    self._getSpecFileCoverage().done(function(coverage) {
        var baseCoverage = coverage,
            specCoveragePromises = [];

        _.forEach(self._config.specs, function(specFile) {
            var deferred = Q.defer();

            self._getSpecFileCoverage(specFile).then(function(specCoverage) {
                _.forOwn(specCoverage, function(coverage, file) {
                    var relativeFile = self._getRelativeFilePath(file),
                        relativeSpecFile = self._getRelativeFilePath(specFile);

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
            if(self._config.mutateProductionCode) {
                fs.remove(self._coverageDir);
            }

            deferred.resolve(self._getAbsoluteSpecPaths(codeSpecs));
        }, function(error) {
            deferred.reject(error);
        });
    });

    return deferred.promise;
};

KarmaCodeSpecsMatcher.prototype.findCodeSpecs = function() {
    return this._config.karma.fileSpecs ? this._findCodeSpecsFromConfig() : this._findCodeSpecsUsingCoverage();
};

module.exports = KarmaCodeSpecsMatcher;
