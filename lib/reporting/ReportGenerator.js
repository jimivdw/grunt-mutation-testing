/**
 * This generator creates reports using istanbul.
 *
 * Created by Merlin Weemaes on 2/26/15.
 */
var path = require('path'),
    HtmlReporter = require('./html/HtmlReporter');

var DEFAULT_DIR = path.join('reports', 'grunt-mutation-testing');


exports.generate = function(opts, results) {
    var dir = opts.dir || DEFAULT_DIR,
        report = new HtmlReporter(dir);

    console.log('Generating the mutation HTML report in directory: ' + dir);

    report.create(results)
        .then(function() {
            console.log('report generator done');
        })
        .catch(function(error) {
            console.error('error creating report', error);
        })
        .done();
};
