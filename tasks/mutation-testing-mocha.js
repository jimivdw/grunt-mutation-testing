/**
 * mutation-testing-mocha
 */
'use strict';

var _ = require('lodash'),
    log4js = require('log4js'),
    Mocha = require('mocha'),
    path = require('path'),
    requireUncache = require('require-uncache');

var CopyUtils = require('../utils/CopyUtils'),
    TestStatus = require('../lib/TestStatus');

var logger = log4js.getLogger('mutation-testing-mocha');

exports.init = function(grunt, opts) {
    if(opts.testFramework !== 'mocha') {
        return;
    }

    var testFiles = opts.specs;
    if(testFiles.length === 0) {
        logger.warn('No test files configured; opts.specs is empty');
    }

    opts.before = function(doneBefore) {
        if(opts.mutateProductionCode) {
            doneBefore();
        } else {
            // Find which files are used in the unit test such that they can be copied
            CopyUtils.copyToTemp(opts.code.concat(opts.specs), 'mutation-testing').done(function(tempDirPath) {
                logger.trace('Copied %j to %s', opts.code.concat(opts.specs), tempDirPath);

                // Set the basePath relative to the temp dir
                opts.basePath = path.join(tempDirPath, opts.basePath);

                testFiles = _.map(testFiles, function(file) {
                    return path.join(tempDirPath, file);
                });

                // Set the paths to the files to be mutated relative to the temp dir
                opts.mutate = _.map(opts.mutate, function(file) {
                    return path.join(tempDirPath, file);
                });

                doneBefore();
            });
        }
    };

    opts.test = function(done) {
        //https://github.com/visionmedia/mocha/wiki/Third-party-reporters
        var mocha = new Mocha({
            reporter: function(runner) {
                //dummyReporter
                //runner.on('fail', function(test, err){
                //console.log('fail: %s -- error: %s', test.fullTitle(), err.message);
                //});
            }
        });

        mocha.suite.on('pre-require', function(context, file) {
            var cache = require.cache || {};
            for(var key in cache) {
                if(cache.hasOwnProperty(key)) {
                    delete cache[key];
                }
            }
            requireUncache(file);
        });

        testFiles.forEach(function(testFile) {
            mocha.addFile(testFile);
        });

        try {
            mocha.run(function(errCount) {
                var testStatus = (errCount === 0) ? TestStatus.SURVIVED : TestStatus.KILLED;
                done(testStatus);
            });
        } catch(error) {
            done(TestStatus.KILLED);
        }
    };
};
