/**
 * KarmaServerManager class, containing functionality for managing a set of Karma servers. This includes the ability to
 * start new servers, and to shut them all down.
 *
 * @author Jimi van der Woning
 */
'use strict';

var _ = require('lodash'),
    Q = require('q'),
    KarmaServer = require('./KarmaServer');

// Base port from which new server instances will connect
var port = 12111;


/**
 * Constructor for a Karma server manager
 *
 * @param config {object} Configuration object for the server.
 * @constructor
 */
function KarmaServerManager(config) {
    this._config = _.merge({ maxActiveServers: 5, startInterval: 100 }, config);
    this._instances = [];
}


/**
 * Get the list of active servers
 *
 * @returns {KarmaServer[]} The list of active Karma servers
 * @private
 */
KarmaServerManager.prototype._getActiveServers = function() {
    return _.filter(this._instances, function(instance) {
        return instance.isActive();
    });
};

/**
 * Start a new Karma server instance. Waits for other servers to shut down if more than config.maxActiveServers are
 * currently active. It will monitor the number of active servers on an interval of config.startInterval milliseconds.
 *
 * @param config {object} The configuration the new instance should use
 * @returns {*|promise} A promise that will resolve with the new server instance once it has been started, and reject
 *                      if it could not be started properly
 */
KarmaServerManager.prototype.startNewInstance = function(config) {
    var self = this,
        deferred = Q.defer(),
        server = new KarmaServer(config, port++);

    function startServer() {
        if(self._getActiveServers().length < self._config.maxActiveServers) {
            deferred.resolve(server.start());
        } else {
            console.log('There are already', self._config.maxActiveServers, 'servers active. Postponing start...');
            setTimeout(startServer, self._config.startInterval);
        }
    }

    this._instances.push(server);
    startServer();

    return deferred.promise;
};

/**
 * Kill all Karma server instances that have not been killed already.
 */
KarmaServerManager.prototype.killAllInstances = function() {
    _.forEach(this._instances, function(instance) {
        instance.isKilled() ? instance.kill() : _.identity();
    });
};

module.exports = KarmaServerManager;
