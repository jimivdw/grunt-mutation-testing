/**
 * Builds the HTML for each file in the given results
 * Created by Martin Koster on 3/2/15.
 */
var _ = require('lodash'),
    fs = require('fs'),
    log4js = require('log4js'),
    path = require('path'),
    Q = require('q');

var HtmlFormatter = require('./HtmlFormatter'),
    IndexHtmlBuilder = require('./IndexHtmlBuilder'),
    StatUtils = require('./StatUtils'),
    Templates = require('./Templates');


var DEFAULT_CONFIG = {
    successThreshold: 80
};

var FileHtmlBuilder = function(config) {
    this._config = _.merge({}, DEFAULT_CONFIG, config);
};

/**
 * creates an HTML report for each file within the given results
 * @param {Array} fileResults mutation results for each file
 * @param {string} baseDir the base directory in which to write the reports
 */
FileHtmlBuilder.prototype.createFileReports = function(fileResults, baseDir) {
    var self = this,
        promises = [];

    _.forEach(fileResults, function(fileResult) {
        promises.push(Q.Promise(function(resolve) {
            var results = fileResult.mutationResults,
                formatter = new HtmlFormatter(fileResult.src);

            formatter.formatSourceToHtml(results, function(formattedSource) {
                writeReport.call(self, fileResult, formatter, formattedSource.split('\n'), baseDir);
                resolve();
            });
        }));
    }, this);

    return Q.all(promises);
};

/**
 * write the report to file
 */
function writeReport(fileResult, formatter, formattedSourceLines, baseDir) {
    var fileName = fileResult.fileName,
        stats = StatUtils.decorateStatPercentages(fileResult.stats),
        parentDir = path.normalize(baseDir + '/..'),
        mutations = formatter.formatMutations(fileResult.mutationResults),
        breadcrumb = new IndexHtmlBuilder(baseDir).linkPathItems({
            currentDir: parentDir,
            fileName: baseDir + '/' + fileName + '.html',
            separator: ' >> ',
            relativePath: getRelativeDistance(baseDir + '/' + fileName, baseDir ),
            linkDirectoryOnly: true
        });

    var file = Templates.fileTemplate({
        sourceLines: formattedSourceLines,
        mutations: mutations
    });

    fs.writeFileSync(
        path.join(baseDir, fileName + ".html"),
        Templates.baseTemplate({
            style: Templates.baseStyleTemplate({ additionalStyle: Templates.fileStyleCode }),
            script: Templates.baseScriptTemplate({ additionalScript: Templates.fileScriptCode }),
            fileName: path.basename(fileName),
            stats: stats,
            status: stats.successRate > this._config.successThreshold ? 'killed' : 'survived',
            breadcrumb: breadcrumb,
            generatedAt: new Date().toLocaleString(),
            content: file
        })
    );
}

function getRelativeDistance(baseDir, currentDir) {
    var relativePath = path.relative(baseDir, currentDir),
        segments = relativePath.split(path.sep);

    return _.filter(segments, function(segment) {
        return segment === '.' || segment === '..';
    }).join('/');
}

module.exports = FileHtmlBuilder;
