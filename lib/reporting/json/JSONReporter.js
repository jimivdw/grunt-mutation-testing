'use strict';

var _ = require('lodash'),
    log4js = require('log4js'),
    path = require('path'),
    Q = require('q');

var IOUtils = require('../../../utils/IOUtils');

var DEFAULT_FILE_NAME = 'mutations.json';

var logger = log4js.getLogger('JSONReporter');


/**
 * JSON report generator.
 *
 * @param {string} dir - Report directory
 * @param {object=} config - Reporter configuration
 * @constructor
 */
function JSONReporter(dir, config) {
    this._config = config;

    var fileName = config.file || DEFAULT_FILE_NAME;
    this._filePath = path.join(dir, fileName);
}

/**
 * Create the JSON report from the given results.
 *
 * @param {object} results - Mutation testing results.
 * @returns {*} - A promise that will resolve when the report has been created successfully and rejected otherwise.
 */
JSONReporter.prototype.create = function(results) {
    var self = this;

    logger.trace('Creating JSON report in %s...', self._filePath);

    IOUtils.createPathIfNotExists(IOUtils.getDirectoryList(self._filePath, true), '.');

    return Q.Promise(function(resolve, reject) {
        var jsonReport = JSON.stringify(getResultsPerDir(results), null, 4);
        IOUtils.promiseToWriteFile(self._filePath, jsonReport)
            .then(function() {
                logger.trace('JSON report created in %s', self._filePath);
                resolve(self._generateResultObject());
            }).catch(function(error) {
                logger.trace('Could not generate JSON report: %s', error);
                reject(error);
            });
    });
};

/**
 * Generate a report generation result object.
 *
 * @returns {{type: string, path: string}}
 * @private
 */
JSONReporter.prototype._generateResultObject = function() {
    return {
        type: 'json',
        path: this._filePath
    };
};

/**
 * Calculate the mutation score from a stats object.
 *
 * @param {object} stats - The stats from which to calculate the score
 * @returns {{total: number, killed: number, survived: number, ignored: number, untested: number}}
 */
function getMutationScore(stats) {
    return {
        total: (stats.all - stats.survived) / stats.all,
        killed: stats.killed / stats.all,
        survived: stats.survived / stats.all,
        ignored: stats.ignored / stats.all,
        untested: stats.untested / stats.all
    };
}

/**
 * Calculate the mutation test results per directory.
 *
 * @param {object} results - Mutation testing results
 * @returns {object} - The mutation test results per directory
 */
function getResultsPerDir(results) {

    /**
     * Decorate the results object with the stats for each directory.
     *
     * @param {object} results - (part of) mutation testing results
     * @returns {object} - Mutation test results decorated with stats
     */
    function addDirStats(results) {
        var dirStats = {
            all: 0,
            killed: 0,
            survived: 0,
            ignored: 0,
            untested: 0
        };

        _.forOwn(results, function(result) {
            var stats = result.stats || addDirStats(result).stats;
            dirStats.all += stats.all;
            dirStats.killed += stats.killed;
            dirStats.survived += stats.survived;
            dirStats.ignored += stats.ignored;
            dirStats.untested += stats.untested;
        });

        results.stats = dirStats;
        return results;
    }

    /**
     * Decorate the results object with the mutation score for each directory.
     *
     * @param {object} results - (part of) mutation testing results, decorated with mutation stats
     * @returns {object} - Mutation test results decorated with mutation scores
     */
    function addMutationScores(results) {
        _.forOwn(results, function(result) {
            if(_.has(result, 'stats')) {
                addMutationScores(result);
            }
        });

        results.mutationScore = getMutationScore(results.stats);
        return results;
    }

    var resultsPerDir = {};

    _.forEach(_.clone(results), function(fileResult) {
        _.set(resultsPerDir, IOUtils.getDirectoryList(fileResult.fileName), fileResult);
    });

    return addMutationScores(addDirStats(resultsPerDir));
}

module.exports = JSONReporter;
