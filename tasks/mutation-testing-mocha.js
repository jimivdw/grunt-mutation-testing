var Mocha = require('mocha');
var requireUncache = require('require-uncache');
var _ = require('lodash');
var path = require('path');
var CopyUtils = require('../utils/CopyUtils');

exports.init = function(grunt, opts) {
    if(!opts.mocha) {
        return;
    }

    var testFiles = grunt.file.expand(opts.mocha.testFiles);
    if(testFiles.length === 0) {
        grunt.log.error('No test files found for testFiles =', opts.mocha.testFiles);
    }

    opts.before = function(doneBefore) {
        if(opts.mutateProductionCode) {
            doneBefore();
        } else {
            // TODO: the default behaviour does not perform well. There is probably a smarter way of doing this.
            var unitTestFiles = opts.unitTestFiles || ['*.js', '**/*.js'];
            CopyUtils.copyToTemp(unitTestFiles, 'mutation-testing').done(function(tempDirPath) {
                // Set the paths to the files to be mutated relative to the temp dir
                var files = [];
                opts.files.forEach(function(fileSet) {
                    files.push({
                        src: fileSet.src.map(function(file) {
                            return path.join(tempDirPath, file);
                        }),
                        dest: fileSet.dest
                    });
                });
                opts.files = files;

                for(var i = 0; i < testFiles.length; i++) {
                    testFiles[i] = path.join(tempDirPath, testFiles[i]);
                }

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
                var withoutErrors = (errCount === 0);
                done(withoutErrors);
            });
        } catch(error) {
            done(false);
        }
    };
};
