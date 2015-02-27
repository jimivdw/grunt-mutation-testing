/**
 * This generator creates reports using istanbul.
 *
 * Created by Merlin Weemaes on 2/26/15.
 */
var istanbul = require('istanbul');
var fs = require('fs');

exports.generate = function (opts) {
    var Report = istanbul.Report,
        report = Report.create(opts.type, { 'dir' : opts.dir+'/grunt-mutation-test-report'}),
        collector = new istanbul.Collector;

    var coverageObject = JSON.parse(fs.readFileSync(opts.dir + "/coverage.json", 'UTF8'));
    var configObj = require('istanbul').config.loadFile();

    console.log(configObj.reporting.dir());
    collector.add(coverageObject);
    report.on('done', function () {
        console.log('report generator done');
    });
    report.writeReport(collector);
}
