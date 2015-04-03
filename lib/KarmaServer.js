/**
 * KarmaServer
 *
 * @author Jimi van der Woning
 */
'use strict';

var _ = require('lodash'),
    path = require('path'),
    Q = require('q'),
    spawn = require('child_process').spawn;

var runner;

function KarmaServer(karmaConfig, port) {
    this._karmaConfig = _.merge({ waitForServerTime: 5, waitForRunnerTime: 2 }, karmaConfig, { port: port });
    this._serverProcess;

    runner = require('karma').runner;
}

KarmaServer.prototype.start = function() {
    var self = this,
        deferred = Q.defer(),
        startTime = Date.now(),
        serverTimeout;

    console.log('Starting a Karma server on port ' + self._karmaConfig.port + '...');

    serverTimeout = setTimeout(function() {
        deferred.reject('Could not connect to a Karma server on port ' + self._karmaConfig.port + ' within ' +
        self._karmaConfig.waitForServerTime + ' seconds');
    }, self._karmaConfig.waitForServerTime * 1000);

    self._serverProcess = spawn(
        'node',
        [
            path.join(__dirname, '..', 'lib', 'run-karma-in-background.js'),
            JSON.stringify(self._karmaConfig)
        ],
        { stdio: 'pipe' }
    );

    self._serverProcess.stdout.on('data', function(data) {
        var message = data.toString('utf-8');
        console.log(message);

        // This is a hack: Karma exposes no method of determining when the server is started up, so we dissect the logs
        if(message.indexOf('Connected on socket') > -1) {
            clearTimeout(serverTimeout);
            console.log('Server started after ' + (Date.now() - startTime) + 'ms and is listening on port ' +
            self._karmaConfig.port);
            deferred.resolve(self);
        }
    });

    return deferred.promise;
};

KarmaServer.prototype.runTests = function() {
    var self = this,
        deferred = Q.defer(),
        runnerTimeout;

    setTimeout(function() {
        runnerTimeout = setTimeout(function() {
            console.warn('Warning! Infinite loop detected. This may put a strain on your CPU.');
            deferred.reject('Infinite loop detected');
        }, self._karmaConfig.waitForRunnerTime * 1000);

        runner.run(
            self._karmaConfig,
            function(exitCode) {
                clearTimeout(runnerTimeout);
                deferred.resolve(exitCode === 0);
            }
        );
    }, 100);

    return deferred.promise;
}

KarmaServer.prototype.kill = function() {
    this._serverProcess.kill();
}

module.exports = KarmaServer;
