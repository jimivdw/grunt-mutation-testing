var path = require('path');
var _ = require('lodash');
var exec = require('sync-exec');

exports.init = function (opts) {
  if (!opts.karma) {
    return;
  }

  var runner = require('karma').runner;
  var server = require('karma').server;

  opts.before = function (doneBefore) {
    server.start({
      background: false,
      singleRun: false,
      reporters: [],
      logLevel: 'OFF',
      autoWatch: false,
      configFile: path.resolve(opts.karma.configFile)
    });
    // Better: https://github.com/karma-runner/karma/issues/1037
    // https://github.com/karma-runner/karma/issues/535
    setTimeout(function () {
      doneBefore();
    }, 2000);
    // Stopping is also an problem
    // https://github.com/karma-runner/karma/issues/509
    // https://github.com/karma-runner/karma/issues/136
    // killall phantomjs
  };

  opts.test = function (done) {
    runner.run({}, function (numberOfCFailingTests) {
      done(numberOfCFailingTests === 0);
    });
  };

  opts.after = function () {
    exec('killall phantomjs');
  };

};