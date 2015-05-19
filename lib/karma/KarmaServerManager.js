/**
 * KarmaServer class that contains all functionality for managing a Karma server. This includes starting the server,
 * stopping the server, and running tests on the server.
 *
 * @author Martin Koster
 * @author Jimi van der Woning
 */
'use strict';

var _ = require('lodash'),
    log4js = require('log4js'),
    path = require('path'),
    Q = require('q'),
    fork = require('child_process').fork,
    TestStatus = require('../TestStatus'),
    KarmaServerStatus = require('./KarmaServerStatus');

var logger = log4js.getLogger('KarmaServer'),
    runner = require('karma').runner;


/**
 * Constructor for a Karma server instance
 *
 * @param config {object} Karma configuration object that should be used
 * @param port {number} The port on which the Karma server should run
 * @param runnerTimeUnlimited {boolean} if set the KarmaServerManager will not limit the running time of the runner
 * @constructor
 */
function KarmaServer(config, port, runnerTimeUnlimited) {
    this._status = null;
    this._serverProcess = null;
    this._runnerTimeUnlimited = runnerTimeUnlimited;
    this._config = _.merge({ waitForServerTime: 10, waitForRunnerTime: 2 }, config, { port: port });
}

/**
 * Set the status of the server instance to the given status.
 *
 * @param status {number} The new status the server instance should have
 * @private
 */
KarmaServer.prototype._setStatus = function(status) {
    this._status = status;
    logger.trace('Server status changed to: %s', _.findKey(KarmaServerStatus, function(kss) {
        return kss === status;
    }));
};

/**
 * Start the Karma server instance, if it has not been started before
 *
 * @returns {*|promise} a promise that will resolve with the instance itself when the instance starts properly within
 *                      config.waitForServerTime seconds, and reject otherwise
 */
KarmaServer.prototype.start = function() {
    var deferred = Q.defer();

    // Only servers that have not yet been started can be started
    if(this._status === null) {
        logger.trace('Starting a Karma server on port %d...', this._config.port);
        this._setStatus(KarmaServerStatus.INITIALIZING);

        // Start a new Karma server process
        this._serverProcess = startServer.call(this, deferred);
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
        runnerTimeout,
        timeoutFunction = function() {
            self._setStatus(KarmaServerStatus.DEFUNCT);
            deferred.reject({
                severity: 'fatal',
                message: 'Warning! Infinite loop detected. This may put a strain on your CPU.'
            });
        };

    // Only idle servers can run the tests
    if(self._status === KarmaServerStatus.READY) {
        self._setStatus(KarmaServerStatus.RUNNING);

        setTimeout(function() {
            // Limit the time a run can take to config.waitForRunnerTime seconds
            runnerTimeout = setTimeout(
                self._runnerTimeUnlimited ? function() {} : timeoutFunction,
                self._config.waitForRunnerTime * 1000
            );

            runner.run(
                self._config,
                function(exitCode) {
                    clearTimeout(runnerTimeout);
                    self._setStatus(KarmaServerStatus.READY);
                    deferred.resolve(exitCode === 0 ? TestStatus.SURVIVED : TestStatus.KILLED);
                }
            );
        }, 100);
    } else {
        deferred.reject('Server is not ready to run tests');
    }

    return deferred.promise;
};

/**
 * Stop the server instance, if it has not been killed previously
 */
KarmaServer.prototype.stop = function() {
    if(!this.isStopped()) {
        this._serverProcess.send({ command: 'stop' });
        this._setStatus(KarmaServerStatus.STOPPED);
    }
};

/**
 * forcibly stop the server instance no matter what
 */
KarmaServer.prototype.kill = function() {
    this._serverProcess.kill();
    this._setStatus(KarmaServerStatus.KILLED);
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
 * Determine if the server instance is no longer running
 *
 * @returns {boolean} indication if the server is no longer running
 */
KarmaServer.prototype.isStopped = function() {
    return this._status === KarmaServerStatus.STOPPED || this._status === KarmaServerStatus.KILLED;
};

/**
 * start a karma server by calling node's "fork" method.
 * The stdio will be piped to the current process so that it can be read and interpreted
 */
function startServer(serverPromise) {
    var self = this,
        startTime = Date.now(),
        browsersStarting,
        serverTimeout,
        serverProcess = fork(__dirname + '/KarmaWorker.js', { silent: true });

    // Limit the time it can take for a server to start to config.waitForServerTime seconds
    serverTimeout = setTimeout(function() {
        self._setStatus(KarmaServerStatus.DEFUNCT);
        serverPromise.reject(
            'Could not connect to a Karma server on port ' + self._config.port + ' within ' +
            self._config.waitForServerTime + ' seconds'
        );
    }, self._config.waitForServerTime * 1000);

    serverProcess.send({ command: 'start', config: self._config });

    serverProcess.stdout.on('data', function(data) {
        var message = data.toString('utf-8'),
            messageParts = message.split(/\s/g);

        logger.debug(message);

        //this is a hack: because Karma exposes no method of determining when the server is started up we'll dissect the log messages
        if(message.indexOf('Starting browser') > -1) {
            browsersStarting = browsersStarting ? browsersStarting.concat([messageParts[4]]) : [messageParts[4]];
        }
        if(message.indexOf('Connected on socket') > -1) {
            browsersStarting.pop();
            if(browsersStarting && browsersStarting.length === 0) {
                clearTimeout(serverTimeout);
                self._setStatus(KarmaServerStatus.READY);

                logger.info(
                    'Karma server started after %dms and is listening on port %d',
                    (Date.now() - startTime), self._config.port
                );

                serverPromise.resolve(self);
            }
        }
    });

    return serverProcess;
}

module.exports = KarmaServer;
