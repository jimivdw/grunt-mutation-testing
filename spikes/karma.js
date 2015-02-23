var runner = require('karma').runner;
var server = require('karma').server;
var path = require('path');


server.start({
    background: false,
    singleRun: false,
    browsers: ['PhantomJS'],
    configFile: path.resolve('test/fixtures/karma-mocha/karma.conf.js'),
    reporters: []
});

console.log('Testing');

setTimeout(function () {
    runner.run({}, function (numberOfCFailingTests) {
        console.log('run:', numberOfCFailingTests);
    });
}, 2000);

setTimeout(function () {
    runner.run({}, function (numberOfCFailingTests) {
        console.log('run:', numberOfCFailingTests);
    });
}, 30000);

// https://github.com/karma-runner/karma/issues/509
// https://github.com/karma-runner/karma/issues/136
// killall phantomjs
setTimeout(function () {
    //server.stop();
}, 4000);
