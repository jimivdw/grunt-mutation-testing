var server = require('karma').server;

process.on('message', function(message) {
    if (message.command === 'start') {
        server.start(message.config);
    } else if (message.command === 'stop') {
        process.kill(process.pid);
    }
});
