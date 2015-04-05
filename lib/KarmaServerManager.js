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

function KarmaServerManager() {
    this._instances = [];
}

KarmaServerManager.prototype.startNewInstance = function(config) {
    var server = new KarmaServer(config, port++);
    this._instances.push(server);
    return server.start();
};

KarmaServerManager.prototype.killAllInstances = function() {
    _.forEach(this._instances, function(instance) {
        instance.isKilled() ? instance.kill() : _.identity();
    });
};

module.exports = KarmaServerManager;
