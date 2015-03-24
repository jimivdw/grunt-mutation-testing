/*
 * grunt-mutation-testing
 *
 *
 * Copyright (c) 2014 Marco Stahl
 * Licensed under the MIT license.
 *
 * TODO (Martin Koster): split up this file and refactor to effect better separation of concerns. That should also improve legibility
 */

'use strict';
var esprima = require('esprima');
var fs = require('fs');
var exec = require('sync-exec');
var path = require('path');
var Q = require('q');
var _ = require('lodash');
var os = require('os');

var Mutator = require('../lib/Mutator');
var mutationTestingKarma = require('./mutation-testing-karma');
var mutationTestingMocha = require('./mutation-testing-mocha');

var reportGenerator = require('../lib/reporting/ReportGenerator');
var notFailingMutations = [];

function ensureRegExpArray(value) {
    var array = _.isArray(value) ? value : [value];
    return array.map(function (stringOrRegExp) {
        return _.isString(stringOrRegExp) ? new RegExp('^' + stringOrRegExp + '$') : stringOrRegExp;
    });
}

function canBeIgnored(opts, src, mutation) {
    if (!opts.ignore) {
        return false;
    }
    var ignorePatterns = ensureRegExpArray(opts.ignore);
    var affectedSrcPart = src.substring(mutation.begin, mutation.end);
    return _.any(ignorePatterns, function (ignorePattern) {
        return ignorePattern.test(affectedSrcPart);
    });
}

function canBeDiscarded(opts, mutation) {
    if (!opts.discardReplacements) {
        return false;
    }
    var discardPatterns = ensureRegExpArray(opts.discardReplacements);
    return _.any(discardPatterns, function (discardPattern) {
        return discardPattern.test(mutation.replacement);
    });
}

function createStats() {
    return {
        all: 0,
        ignored: 0,
        untested: 0,
        survived: 0
    };
}

function addStats(stats1, stats2) {
    return _.mapValues(stats1, function (value, key) {
        return value + stats2[key];
    });
}

function createStatsMessage(stats) {
    var ignoredMessage = stats.ignored ? ' ' + stats.ignored + ' mutations were ignored.' : '';
    var allUnIgnored = stats.all - stats.ignored;
    var testedMutations = allUnIgnored - stats.untested - stats.survived;
    var percentTested = Math.floor((testedMutations / allUnIgnored) * 100);
    return testedMutations +
        ' of ' + allUnIgnored + ' unignored mutations are tested (' + percentTested + '%).' + ignoredMessage;
}

function truncateReplacement(opts, replacementArg) {
    var maxLength = opts.maxReplacementLength !== undefined ? opts.maxReplacementLength : 20;
    var replacement = replacementArg.replace(/\s+/g, ' ');
    if (maxLength > 0 && replacement.length > maxLength) {
        return replacement.slice(0, maxLength / 2) + ' ... ' + replacement.slice(-maxLength / 2);
    }
    return replacement;
}

function stripOffTempPath(originalSources, srcFile) {
//if the actual mutation happens in a temp dir, strip off the path to the temp dir by analysing the originalSources
    _.forEach(originalSources, function (source) {
        var sourceDir = path.dirname(source),
            sourceDirIndex = srcFile.indexOf(sourceDir);

        if (sourceDirIndex > -1) {
            srcFile = srcFile.substr(sourceDirIndex);
        }
    });
    return srcFile;
}

function createMutationFileMessage(opts, srcFile, originalSources) {
    // Normalize Windows paths to use '/' instead of '\\'
    if(os.platform() === 'win32') {
        srcFile = srcFile.replace(/\\/g, '/');
    }

    srcFile = stripOffTempPath(originalSources, srcFile);

    // Strip off anything before the basePath when present
    if(opts.basePath && srcFile.indexOf(opts.basePath) !== -1) {
        srcFile = srcFile.substr(srcFile.indexOf(opts.basePath));
    }

    return srcFile;
}

function createMutationLogMessage(opts, srcFilePath, mutation, src, testSurvived, originalSources) {
    var srcFileName = createMutationFileMessage(opts, srcFilePath, originalSources),
        result = testSurvived ? "SURVIVED" : "KILLED",
        currentMutationPosition = srcFileName + ':' + mutation.line + ':' + (mutation.col + 1),
        mutatedCode = src.substr(mutation.begin, mutation.end - mutation.begin),
        message = currentMutationPosition + (
            mutation.replacement ?
            ' Replaced ' + truncateReplacement(opts, mutatedCode) + ' with ' + truncateReplacement(opts, mutation.replacement) + ' -> ' + result :
            ' Removed ' + truncateReplacement(opts, mutatedCode) + ' -> ' + result
            );

    return {
        mutation: mutation,
        survived: testSurvived,
        message: message
    };
}

function createNotTestedBecauseInsideUntestedMutationLogMessage(opts, srcFilePath, mutation, originalSources) {
    var srcFileName = createMutationFileMessage(opts, srcFilePath, originalSources);
    var currentMutationPosition = srcFileName + ':' + mutation.line + ':' + (mutation.col + 1);
    return currentMutationPosition + ' is inside a surviving mutation';
}

function isInsideNotFailingMutation(innerMutation) {
    return _.indexOf(notFailingMutations, innerMutation.parentMutationId) > -1;
}

/**
 * @param {string} srcFilename
 * @param {function} runTests
 * @param {function} logMutation
 * @param {function} log the logger
 * @param {object} opts the config options
 */
function mutationTestFile(srcFilename, runTests, logMutation, log, opts, originalSources) {
    var src = fs.readFileSync(path.resolve(srcFilename), 'UTF8');
    var mutator = new Mutator(src);
    var mutations = mutator.collectMutations(opts.excludeMutations);
    var mutationPromise = new Q({});

    var stats = createStats();
    var fileMutationResult = {
        stats: stats,
        src: src,
        fileName: stripOffTempPath(originalSources, srcFilename),
        mutationResults: []
    };

    log('\nMutating file ' + srcFilename + '\n');

    mutations.forEach(function (mutation) {
        stats.all += 1;
        if (canBeDiscarded(opts, mutation)) {
            return;
        }
        if (canBeIgnored(opts, src, mutation)) {
            stats.ignored += 1;
            return;
        }
        var perc = Math.round((stats.all / mutations.length) * 100);
        mutationPromise = mutationPromise.then(function () {
            log('Line ' + mutation.line + ' (' + perc + '%), ');
            if (opts.dontTestInsideNotFailingMutations && isInsideNotFailingMutation(mutation)) {
                stats.untested += 1;
                logMutation(createNotTestedBecauseInsideUntestedMutationLogMessage(opts, srcFilename, mutation, originalSources));
                return;
            }
            fs.writeFileSync(srcFilename, mutator.applyMutation(mutation));
            return runTests().then(function (testSurvived) {
                //console.log('success!!');
				var mutationResult = createMutationLogMessage(opts, srcFilename, mutation, src, testSurvived, originalSources);
                fileMutationResult.mutationResults.push(mutationResult);
                if (testSurvived) {
                    stats.survived += 1;
                    logMutation(mutationResult.message);
                    notFailingMutations.push(mutation.mutationId);
                }
            });
        });
    });

    mutationPromise = mutationPromise.then(function () {
        return {stats: stats, fileMutationResult: fileMutationResult};
    });

    return mutationPromise.fin(function () {
        console.log('\nRestore ', srcFilename);
        fs.writeFileSync(srcFilename, src);
    });
}


function mutationTest(grunt, task, opts) {
    var done = task.async();
    var mutationTestPromise = new Q();
    var totalResults = [];
    function logToMutationReport(fileDest, msg) {
        if (fileDest === 'LOG') {
            grunt.log.writeln('\n' + msg);
            return;
        }
        if (!grunt.file.exists(fileDest)) {
            grunt.file.write(fileDest, '');
        }
        fs.appendFileSync(fileDest, msg + '\n');
    }

    function createMutationCoverageReport(results){
        if(task.data.mutationCoverageReporter) {
            grunt.log.writeln('Generating the mutation coverage report in directory: '+task.data.mutationCoverageReporter.dir);
            reportGenerator.generate(task.data.mutationCoverageReporter, results);
        }
    }

    function runTests() {
        var deferred = Q.defer();
        if (typeof opts.test === 'string') {
            var execResult = exec(opts.test);
            deferred.resolve(execResult.status === 0);
        } else {
            opts.test(function (ok) {
                deferred.resolve(ok);
            });
        }
        return deferred.promise;
    }

    opts.before(function () {
        var files = opts.files;

        // run first without mutations
        runTests().done(function (testOk) {
            if (!testOk) {
                files.forEach(function (file) {
                    logToMutationReport(file.dest, 'Tests fail without mutations.');
                });
            } else {
                files.forEach(function (file) {
                    mutationTestPromise = mutationTestPromise.then(function () {
                        var validFiles = file.src.filter(function (filepath) {
                            if (!grunt.file.exists(filepath)) {
                                grunt.log.warn('Source file "' + filepath + '" not found.');
                                return false;
                            } else {
                                return true;
                            }
                        });

                        if (validFiles.length === 0) {
                            grunt.log.warn('Found no valid files in ' + JSON.stringify(file.orig.src));
                            return false;
                        }

                        function log(msg) {
                            grunt.log.write(msg);
                        }

                        var logMutationToFileDest = _.partial(logToMutationReport, file.dest);
                        var statsSummary = createStats();

                        var mutationFilesPromise = new Q();
                        validFiles.forEach(function (srcFile) {
                            mutationFilesPromise = mutationFilesPromise.then(function () {
								return mutationTestFile(srcFile, runTests, logMutationToFileDest, log, opts, file.orig.src).then(function (opts) {
                                    statsSummary = addStats(statsSummary, opts.stats);
                                    totalResults.push(opts.fileMutationResult);
                                });
                            });
                        });

                        mutationFilesPromise = mutationFilesPromise.then(function () {
                            logMutationToFileDest(createStatsMessage(statsSummary));
                        });

                        return mutationFilesPromise;
                    });
                });
            }

            mutationTestPromise.then(function () {
                createMutationCoverageReport(totalResults);
                var dfd = Q.defer();
                opts.after(function () {
                    dfd.resolve();
                });
                return dfd.promise;
            });
            mutationTestPromise.done(done);
        });
    });
}

function callDone(done) {
    done(true);
}

var DEFAULT_OPTIONS = {
    test: callDone,
    before: callDone,
    after: callDone,
    files: []
};

module.exports = function (grunt) {
    grunt.registerMultiTask('mutationTest', 'Test your tests by mutating the production code.', function () {
        var opts = this.options(DEFAULT_OPTIONS);
        opts.files = this.files;
        mutationTestingKarma.init(grunt, opts);
        mutationTestingMocha.init(grunt, opts);
        mutationTest(grunt, this, opts);
    });
};
