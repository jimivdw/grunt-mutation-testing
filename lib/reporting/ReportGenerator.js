/**
 * This generator creates reports using istanbul.
 *
 * Created by Merlin Weemaes on 2/26/15.
 */
var log4js = require('log4js'),
    path = require('path');

var HtmlReporter = require('./html/HtmlReporter');

var DEFAULT_DIR = path.join('reports', 'grunt-mutation-testing');

var logger = log4js.getLogger('ReportGenerator');

exports.generate = function(config, results) {
    var dir = config.dir || DEFAULT_DIR,
        report = new HtmlReporter(dir, config);

    logger.trace('Generating the mutation HTML report...');

    report.create(results)
        .then(function() {
            logger.info('Generated the mutation HTML report in: %s', dir);
        })
        .catch(function(error) {
            logger.error('Error creating report: %s', error.message || error);
        })
        .done();
};
