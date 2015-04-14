var server = require('karma').server;
var exec = require('child_process').exec;

process.on('message', function(message) {
    if (message.command === 'start') {
        server.start(message.config);
    } else if (message.command === 'stop') {
        exec('kill ' + process.pid);
    }
});
