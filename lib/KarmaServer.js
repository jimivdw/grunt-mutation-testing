/**
 * KarmaServer
 *
 * @author Jimi van der Woning
 */
'use strict';

var _ = require('lodash'),
    path = require('path'),
    Q = require('q'),
    spawn = require('child_process').spawn,
    KarmaServerStatus = require('./KarmaServerStatus');

var runner;

function KarmaServer(karmaConfig, port) {
    this._status = null;
    this._serverProcess = null;
    this._karmaConfig = _.merge({ waitForServerTime: 10, waitForRunnerTime: 2 }, karmaConfig, { port: port });

    runner = require('karma').runner;
}

KarmaServer.prototype._setStatus = function(status) {
    this._status = status;
};

KarmaServer.prototype.start = function() {
    var self = this,
        deferred = Q.defer(),
        startTime = Date.now(),
        serverTimeout;

    if(self._status === null) {
        console.log('Starting a Karma server on port ' + self._karmaConfig.port + '...');
        self._setStatus(KarmaServerStatus.INITIALIZING);

        serverTimeout = setTimeout(function() {
            self._setStatus(KarmaServerStatus.DEFUNCT);
            deferred.reject(
                'Could not connect to a Karma server on port ' + self._karmaConfig.port + ' within ' +
                self._karmaConfig.waitForServerTime + ' seconds'
            );
        }, self._karmaConfig.waitForServerTime * 1000);

        self._serverProcess = spawn(
            'node',
            [
                path.join(__dirname, 'run-karma-in-background.js'),
                JSON.stringify(self._karmaConfig)
            ],
            { stdio: 'pipe' }
        );

        self._serverProcess.stdout.on('data', function(data) {
            var message = data.toString('utf-8');
            console.log(message);

            // This is a hack: Karma exposes no method of determining when the server is started up. We dissect the logs
            if(message.indexOf('Connected on socket') > -1) {
                clearTimeout(serverTimeout);
                self._setStatus(KarmaServerStatus.READY);
                console.log(
                    'Server started after ' + (Date.now() - startTime) + 'ms and is listening on port ' +
                    self._karmaConfig.port
                );
                deferred.resolve(self);
            }
        });
    } else {
        deferred.reject('Server has already been started');
    }

    return deferred.promise;
};

KarmaServer.prototype.runTests = function() {
    var self = this,
        deferred = Q.defer(),
        runnerTimeout;

    if(self._status === KarmaServerStatus.READY) {
        self._setStatus(KarmaServerStatus.RUNNING);
        setTimeout(function() {
            runnerTimeout = setTimeout(function() {
                self._setStatus(KarmaServerStatus.DEFUNCT);
                console.warn('Warning! Infinite loop detected. This may put a strain on your CPU.');
                deferred.reject('Infinite loop detected');
            }, self._karmaConfig.waitForRunnerTime * 1000);

            runner.run(
                self._karmaConfig,
                function(exitCode) {
                    clearTimeout(runnerTimeout);
                    self._setStatus(KarmaServerStatus.READY);
                    deferred.resolve(exitCode === 0);
                }
            );
        }, 100);
    } else {
        deferred.reject('Server is not ready to run tests');
    }

    return deferred.promise;
};

KarmaServer.prototype.kill = function() {
    if(this._status !== KarmaServerStatus.KILLED) {
        this._serverProcess.kill();
        this._setStatus(KarmaServerStatus.KILLED);
    }
};

module.exports = KarmaServer;
