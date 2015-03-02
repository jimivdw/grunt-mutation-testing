/**
 * This generator creates reports using istanbul.
 *
 * Created by Merlin Weemaes on 2/26/15.
 */
var HtmlReporter = require('./html/HtmlReporter');
var fs = require('fs');
var reporterMapping = {'html': HtmlReporter};

exports.generate = function (opts, results) {
    var Reporter = reporterMapping[opts.type] || HtmlReporter,
        report = (new Reporter(opts.dir+'/grunt-mutation-test-report'));

    report.create(results);
    report.on('done', function () {
        console.log('report generator done');
    });
    report.writeReport(collector);
};

