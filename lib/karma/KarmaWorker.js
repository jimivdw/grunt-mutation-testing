var Server = require('karma').Server;

var server;

process.on('message', function(message) {
    if (message.command === 'start') {
        server = new Server(message.config);
        server.start();
    } else if (message.command === 'stop') {
        var launcher = server.get('launcher');
        launcher.killAll(function() {
            process.kill(process.pid);
        });
    }
});
