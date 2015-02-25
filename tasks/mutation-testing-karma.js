var path = require('path');
var _ = require('lodash');

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

        process.on(
            'exit', function () {
                backgroundProcesses.forEach(
                    function (bgProcess) {
                        bgProcess.kill();
                    }
                );
            }
        );

        startServer(doneBefore);
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
