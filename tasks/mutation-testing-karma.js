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
    var karmaConfig = _.extend(
      {
        // defaults, but can be overwritten
        reporters: [],
        logLevel: 'OFF',
        waitForServerTime: 5,
        test: function (done) {
          runner.run({}, function (numberOfCFailingTests) {
            done(numberOfCFailingTests === 0);
          });
        }
      },
      opts.karma,
      {
        // can't be overwritten, because important for us
        configFile: path.resolve(opts.karma.configFile),
        background: false,
        singleRun: false,
        autoWatch: false
      }
    );

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
    }, karmaConfig.waitForServerTime * 1000);

  };

  opts.after = function () {
    backgroundProcess.kill();
  };

};