/**
 * This generator creates reports using istanbul.
 *
 * Created by Merlin Weemaes on 2/26/15.
 */
var path = require('path'),
    HtmlReporter = require('./html/HtmlReporter');

var reporterMapping = { 'html': HtmlReporter };

exports.generate = function(opts, results) {
    var Reporter = reporterMapping[opts.type] || HtmlReporter,
        report = (new Reporter(path.join(opts.dir, 'grunt-mutation-test-report')));

    report.create(results)
        .then(function() {
            console.log('report generator done');
        })
        .catch(function(error) {
            console.error('error creating report', error);
        })
        .done();
};
