var path = require('path');
var _ = require('lodash');

exports.init = function (grunt, opts) {
  if (!opts.karma) {
    return;
  }

  var runner = require('karma').runner;
  var server = require('karma').server;
  var backgroundProcess;

  opts.before = function (doneBefore) {
    var karmaConfig = {
      background: false,
      singleRun: false,
      reporters: [],
      logLevel: 'OFF',
      autoWatch: false,
      configFile: path.resolve(opts.karma.configFile)
    };

    backgroundProcess = grunt.util.spawn({
      cmd: 'node',
      args: [path.join(__dirname, '..', 'lib', 'run-karma-in-background.js'), JSON.stringify(karmaConfig)]
    }, function () {
    });

    process.on('exit', function () {
      backgroundProcess.kill();
    });

    setTimeout(function () {
      doneBefore();
    }, 2000);

  };

  opts.test = function (done) {
    runner.run({}, function (numberOfCFailingTests) {
      done(numberOfCFailingTests === 0);
    });
  };

  opts.after = function () {
    backgroundProcess.kill();
  };

};