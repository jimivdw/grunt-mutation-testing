/**
 * KarmaServer class that contains all functionality for managing a Karma server. This includes starting the server,
 * stopping the server, and running tests on the server.
 *
 * @author Jimi van der Woning
 */
'use strict';

var _ = require('lodash'),
    path = require('path'),
    Q = require('q'),
    spawn = require('child_process').spawn,
    KarmaServerStatus = require('./KarmaServerStatus');

// The Karma test runner
var runner;


/**
 * Constructor for a Karma server instance
 *
 * @param config {object} Karma configuration object that should be used
 * @param port {number} The port on which the Karma server should run
 * @constructor
 */
function KarmaServer(config, port) {
    this._status = null;
    this._serverProcess = null;
    this._config = _.merge({ waitForServerTime: 10, waitForRunnerTime: 2 }, config, { port: port });

    runner = require('karma').runner;
}

/**
 * Set the status of the server instance to the given status.
 *
 * @param status {number} The new status the server instance should have
 * @private
 */
KarmaServer.prototype._setStatus = function(status) {
    this._status = status;
};

/**
 * Start the Karma server instance, if it has not been started before
 *
 * @returns {*|promise} a promise that will resolve with the instance itself when the instance starts properly within
 *                      config.waitForServerTime seconds, and reject otherwise
 */
KarmaServer.prototype.start = function() {
    var self = this,
        deferred = Q.defer(),
        startTime = Date.now(),
        serverTimeout;

    // Only servers that have not yet been started can be started
    if(self._status === null) {
        console.log('Starting a Karma server on port ' + self._config.port + '...');
        self._setStatus(KarmaServerStatus.INITIALIZING);

        // Limit the time it can take for a server to start to config.waitForServerTime seconds
        serverTimeout = setTimeout(function() {
            self._setStatus(KarmaServerStatus.DEFUNCT);
            deferred.reject(
                'Could not connect to a Karma server on port ' + self._config.port + ' within ' +
                self._config.waitForServerTime + ' seconds'
            );
        }, self._config.waitForServerTime * 1000);

        // Start a new Karma server process
        self._serverProcess = spawn(
            'node',
            [
                path.join(__dirname, 'run-karma-in-background.js'),
                JSON.stringify(self._config)
            ],
            { stdio: 'pipe' }
        );

        // Handle data the Karma server writes to stdout
        self._serverProcess.stdout.on('data', function(data) {
            var message = data.toString('utf-8');

            // This is a hack: Karma exposes no method of determining when the server is started up. We dissect the logs
            if(message.indexOf('Connected on socket') > -1) {
                clearTimeout(serverTimeout);
                self._setStatus(KarmaServerStatus.READY);
                console.log(
                    'Server started after ' + (Date.now() - startTime) + 'ms and is listening on port ' +
                    self._config.port
                );
                deferred.resolve(self);
            }
        });
    } else {
        deferred.reject('Server has already been started');
    }

    return deferred.promise;
};

/**
 * Run the Karma tests on the server instance, if the instance is ready to run tests
 *
 * @returns {*|promise} a promise that will resolve with the test result when no errors occur and the run does not
 *                      exceed config.waitForRunnerTime seconds, and reject otherwise
 */
KarmaServer.prototype.runTests = function() {
    var self = this,
        deferred = Q.defer(),
        runnerTimeout;

    // Only idle servers can run the tests
    if(self._status === KarmaServerStatus.READY) {
        self._setStatus(KarmaServerStatus.RUNNING);

        setTimeout(function() {
            // Limit the time a run can take to config.waitForRunnerTime seconds
            runnerTimeout = setTimeout(function() {
                self._setStatus(KarmaServerStatus.DEFUNCT);
                console.warn('Warning! Infinite loop detected. This may put a strain on your CPU.');
                deferred.reject('Infinite loop detected');
            }, self._config.waitForRunnerTime * 1000);

            runner.run(
                self._config,
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

/**
 * Kill the server instance, if it has not been killed previously
 */
KarmaServer.prototype.kill = function() {
    if(this._status !== KarmaServerStatus.KILLED) {
        this._serverProcess.kill();
        this._setStatus(KarmaServerStatus.KILLED);
    }
};

/**
 * Determine if the server instance is active, i.e. if it is either initializing, ready or running
 *
 * @returns {boolean} indication if the server instance is active
 */
KarmaServer.prototype.isActive = function() {
    return [KarmaServerStatus.INITIALIZING, KarmaServerStatus.READY, KarmaServerStatus.RUNNING]
            .indexOf(this._status) !== -1;
};

/**
 * Determine if the server instance has been killed
 *
 * @returns {boolean} indication if the server has been killed
 */
KarmaServer.prototype.isKilled = function() {
    return this._status === KarmaServerStatus.KILLED;
};

module.exports = KarmaServer;
