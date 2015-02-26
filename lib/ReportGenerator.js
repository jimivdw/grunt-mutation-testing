/**
 * This generator creates reports using istanbul.
 *
 * Created by Merlin Weemaes on 2/26/15.
 */
var istanbul = require('istanbul');
var fs = require('fs');

exports.generate = function()
{
    var Report = istanbul.Report,
        report = Report.create('html'),
        collector = new istanbul.Collector;

    var coverageObject = fs.readFileSync("test/coverage.json", 'UTF8');
    collector.add(coverageObject);
    report.on('done', function () {
        console.log('done');
    });
    report.writeReport(collector);
}
