/**
 * Originally created by Merlin Weemaes on 2/26/15.
 */
var _ = require('lodash'),
    log4js = require('log4js'),
    path = require('path'),
    Q = require('q');

var HtmlReporter = require('./html/HtmlReporter'),
    IOUtils = require('../../utils/IOUtils'),
    JSONReporter = require('./json/JSONReporter');

var DEFAULT_BASE_DIR = path.join('reports', 'grunt-mutation-testing');

var logger = log4js.getLogger('ReportGenerator');

exports.generate = function(config, results) {
    var reporters = [];

    _.forOwn(config, function(reporterConfig, reporterType) {
        var dir = reporterConfig.dir || path.join(DEFAULT_BASE_DIR, reporterType);
        if(reporterType === 'html') {
            reporters.push(new HtmlReporter(dir, reporterConfig));
        } else if(reporterType === 'json') {
            reporters.push(new JSONReporter(dir, reporterConfig));
        }
    });

    var reportCreators = _.map(reporters, function(reporter) {
        return reporter.create(results);
    });

    Q.allSettled(reportCreators).then(function(results) {
        _.forEach(results, function(result) {
            if(result.state === 'fulfilled') {
                logger.info('Generated the mutation %s report in: %s', result.value.type, result.value.path);
            } else {
                logger.error('Error creating report: %s', result.reason.message || result.reason);
            }
        });
    });
};
