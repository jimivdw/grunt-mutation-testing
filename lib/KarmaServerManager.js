/**
 * Created by martin on 25/03/15.
 */
var spawn = require('child_process').spawn,
    _ = require('lodash'),
    util = require('util'),
    path = require('path'),
    EventEmitter = require('events').EventEmitter,
    Q = require('q');

util.inherits(KarmaServerManager, EventEmitter); //inheriting from EventEmitter allows us to emit events
function KarmaServerManager(port, karmaConfig) {
    this._serverInstances = [];
    this._port = port;
    this._karmaConfig = karmaConfig || {waitForServerTime : 5};
    EventEmitter.call(this);
}

/**
 * sets the arma configuration
 * @param {object} karmaConfig the configuration for the karma server
 */
KarmaServerManager.prototype.setKarmaConfig = function(karmaConfig) {
    this._karmaConfig = karmaConfig;
};

/**
 * Intializes a given number of karma servers
 * @param {number} numberOfInstances number of servers to initialize
 */
KarmaServerManager.prototype.initServers = function (numberOfInstances) {
    var self = this,
        serverInstances = [];

    //start a karma server by calling node's "spawn" method. the stdio will be piped to the current process so that it can be read and interpreted
    function startServer(karmaConfig, callback) {
        var browsersStarting,
            karmaBackgroundJS = path.join(__dirname, '..', 'lib', 'run-karma-in-background.js'),
            args = [karmaBackgroundJS, JSON.stringify(karmaConfig)];

        var serverProcess = spawn('node', args, {stdio: 'pipe'});
        serverProcess.stdout.on('data', function(data) {
            var message = data.toString('utf-8'),
                messageParts = message.split(/\s/g);
            console.log(message);
            //this is a hack: because Karma exposes no method of determining when the server is started up we'll dissect the log messages
            if (message.indexOf('Starting browser') > -1 ) {
                browsersStarting = browsersStarting? browsersStarting.concat([messageParts[4]]) : [messageParts[4]];
            }
            if (message.indexOf('Connected on socket') > -1) {
                browsersStarting.pop();
                if (browsersStarting && browsersStarting.length === 0) {
                    callback();
                }
            }
        });
        return serverProcess;
    }

    //set up initial server instance (without process as we haven't acutally spawned one yet) and add these to the local list
    for(var i=0; i<numberOfInstances; i++) {
        serverInstances.push({port: this._port++, state: 'init'});
    }

    //spawn a karma server process for each instance just added to the local list
    _.forEach(serverInstances, function(instance){
        var startTime = Date.now();
        instance.process = startServer(_.merge(self._karmaConfig, {port: instance.port}), function() {
            instance.state = 'ready';
            console.log('server started after ' + (Date.now() - startTime) + 'ms and listening to port: ' + instance.port);
            self.emit('serverReady', instance);
        })
    });

    //add items on local list to the central list
    this._serverInstances = this._serverInstances.concat(serverInstances);
};

/**
 * Retrieves a server instance.
 * This method returns a Promise which will be resolved as soon as a suitable server instance has been found.
 * This allows us to wait until initializing karma servers are operational
 * @returns {Q.Promise} a promise to return a running server instance
 */
KarmaServerManager.prototype.getServerInstance = function(){
    var self = this;
    return Q.Promise(function(resolve, reject){
        var serverInstance = _.find(self._serverInstances, function(instance) {
            return instance.state === 'ready';
        });
        if (serverInstance) {
            resolve(serverInstance);
        } else {
            serverInstance = _.find(self._serverInstances, function(instance) {
                return instance.state === 'init';
            });
            if (!serverInstance) {
                reject('No running or initializing instances available');
            } else {
                self.once('serverReady', function(instance) {
                    resolve(instance);
                });
            }
        }
    });
};

/**
 * invalidates a server instance byt setting its state to 'expired'
 * @param serverInstance
 */
KarmaServerManager.prototype.invalidateServerInstance = function(serverInstance){
    serverInstance.state = 'expired';
};

/**
 * attempts to kill server processes with status 'expired'
 */
KarmaServerManager.prototype.killExpiredServerInstances = function(){
    _.forEach(this._serverInstances, function(serverInstance) {
        if (serverInstance.state === 'expired') {
            //setTimeout(function() {serverInstance.process.kill();}, 3000);

            //remove that server instance from the list
            //this._serverInstances = _.filter(this._serverInstances, function (instance) {
            //    return instance.process.pid !== serverInstance.process.pid;
            //});
        }
    }, this);
};

/**
 * start a new server instance. This is a convenience method equivalent to initServers(1)
 */
KarmaServerManager.prototype.startServerInstance = function(){
    this.initServers(1);
};

/**
 * kills all server instances that are present on the central list
 */
KarmaServerManager.prototype.killAllServerInstances = function() {
    _.forEach(this._serverInstances, function(serverInstance) {
        serverInstance.process.kill();
    });
    this._serverInstances = [];
};

module.exports = KarmaServerManager;
