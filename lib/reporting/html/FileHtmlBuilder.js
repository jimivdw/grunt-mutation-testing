/**
 * Builds the HTML for each file in the given results
 * Created by Martin Koster on 3/2/15.
 */
var fs = require('fs'),
    _ = require('lodash'),
    path = require('path'),
    Handlebars = require('handlebars'),
    HtmlFormatter = require('./HtmlFormatter'),
    IndexHtmlBuilder = require('./IndexHtmlBuilder');

var fileTemplate = Handlebars.compile(fs.readFileSync(__dirname + '/templates/file.html', 'utf-8'));
var FileHtmlBuilder=  function(successThreshold){
    this._successThreshold = successThreshold || 80;

    Handlebars.registerHelper('json', function(context) {
        return JSON.stringify(context);
    });
};

/**
 * creates an HTML report for each file within the given results
 * @param {Array} fileResults mutation results for each file
 * @param {string} baseDir the base directory in which to write the reports
 */
FileHtmlBuilder.prototype.createFileReports = function(fileResults, baseDir) {
    _.forEach(fileResults, function(fileResult) {
        var results = fileResult.mutationResults,
            formattedSource = '',
            formatter = new HtmlFormatter(fileResult.src),
            formattedSourceLines = formatter.formatSourceToHtml(results).split('\n'),
            stats = fileResult.stats,
            coverage = ((stats.all - stats.survived) / stats.all * 100).toFixed(1),
            mutations = formatter.formatMutations(fileResult.mutationResults);

        _.forEach(formattedSourceLines, function(line){
            formattedSource = formattedSource.concat('<li>', line, '</li>');
        });
        fs.writeFileSync(
            baseDir+"/"+fileResult.fileName+".html",
            fileTemplate({
                style: fs.readFileSync(__dirname + '/templates/file.css', 'utf-8'),
                script: fs.readFileSync(__dirname + '/templates/file.js', 'utf-8'),
                source: '<ol>' + formattedSource + '</ol>',
                mutations: mutations,
                fileName: new IndexHtmlBuilder(baseDir).linkPathItems({
                    currentDir: baseDir, fileName: fileResult.fileName + '.html', separator:' >> ', relativePath: getRelativeDistance(baseDir, fileResult.fileName)
                }),
                stats: stats,
                coverage: coverage,
                coverageStatus: coverage > this._successThreshold ? 'killed' : 'survived'
            }));
    }, this);
};

function getRelativeDistance(baseDir, currentDir) {
    var relativePath = path.relative(baseDir, currentDir),
        segments = relativePath.split(path.sep);

    return _.filter(segments, function(segment) {
        return segment === '.' || segment === '..';
    }).join('/');
}

module.exports = FileHtmlBuilder;
