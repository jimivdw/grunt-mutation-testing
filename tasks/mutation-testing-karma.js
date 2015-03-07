var path = require('path');
var _ = require('lodash');
var karmaParseConfig = require('karma/lib/config').parseConfig;
var CopyUtils = require('../utils/CopyUtils');

exports.init = function (grunt, opts) {
    if (!opts.karma) {
        return;
    }

    var runner = require('karma').runner,
        backgroundProcesses = [],
        startServer,
        karmaConfig,
        port = 12111;

    opts.before = function (doneBefore) {
        karmaConfig = _.extend(
            {
                // defaults, but can be overwritten
                reporters: [],
                logLevel: 'OFF',
                waitForServerTime: 5
            },
            opts.karma,
            {
                // can't be overwritten, because important for us
                configFile: path.resolve(opts.karma.configFile),
                background: false,
                singleRun: false,
                autoWatch: false,
                port: port
            }
        );
        
        // Find which files are used in the unit test such that they can be copied
        var configFileContents = karmaParseConfig(karmaConfig.configFile, {});
        var unitTestFiles = opts.unitTestFiles || opts.karma.files || configFileContents.files.map(function(file) {
            return path.relative(path.resolve('.'), file.pattern);
        });
        
        CopyUtils.copyToTemp(unitTestFiles, 'mutation-testing').done(function(tempDirPath) {
            // Set the basePath relative to the temp dir
            karmaConfig.basePath = path.join(
                tempDirPath,
                path.relative(
                    path.resolve('.'),
                    path.dirname(karmaConfig.configFile)
                )
            );
            
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

            startServer = function (startCallback) {
                //FIXME: nasty fallback in case of infinite looping owing to code mutations. At least make it non-blocking
                backgroundProcesses.push(
                    grunt.util.spawn(
                        {
                            cmd: 'node',
                            args: [
                                path.join(__dirname, '..', 'lib', 'run-karma-in-background.js'),
                                JSON.stringify(karmaConfig)
                            ]
                        }, function () {
                        }
                    )
                );

                setTimeout(
                    function () {
                        startCallback();
                    }, karmaConfig.waitForServerTime * 1000
                );
            };

            startServer(doneBefore);
        });

        process.on(
            'exit', function () {
                backgroundProcesses.forEach(
                    function (bgProcess) {
                        bgProcess.kill();
                    }
                );
            }
        );
    };

    opts.test = function (done) {
        setTimeout(
            function () {
                runner.run(
                    _.merge(karmaConfig, {port: port}),
                    function (exitCode) {
                        clearTimeout(timer);
                        done(exitCode === 0);
                    }
                );

                var timer = setTimeout(
                    function () {
                        grunt.log.warn('\nPotentially infinite loop detected. Starting a new Karma instance...');
                        port++;
                        startServer(
                            function () {
                                done(false);
                            }
                        );
                    }, 2000
                );
            }, 100
        );
    };

    opts.after = function () {
        backgroundProcesses.forEach(
            function (bgProcess) {
                bgProcess.kill();
            }
        );
    };
};
