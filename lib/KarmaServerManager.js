/**
 * KarmaServerManager
 *
 * @author Jimi van der Woning
 */
'use strict';

var _ = require('lodash'),
    Q = require('q'),
    KarmaServer = require('./KarmaServer');

var port = 12111;

function KarmaServerManager(config) {
    this._config = _.merge({ maxActiveServers: 5, startInterval: 100 }, config);
    this._instances = [];
}

KarmaServerManager.prototype._getActiveServers = function() {
    return _.filter(this._instances, function(instance) {
        return instance.isActive();
    });
};

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

KarmaServerManager.prototype.killAllInstances = function() {
    _.forEach(this._instances, function(instance) {
        instance.isKilled() ? instance.kill() : _.identity();
    });
};

module.exports = KarmaServerManager;
