/**
 * Builds the HTML for each file in the given results
 * Created by Martin Koster on 3/2/15.
 */
var fs = require('fs'),
    _ = require('lodash'),
    HandleBars = require('handlebars'),
    HtmlFormatter = require('./HtmlFormatter');

var fileTemplate = HandleBars.compile(fs.readFileSync(__dirname + '/templates/file.html', 'utf-8'));
var FileHtmlBuilder=  function(){
    this._htmlFormatter = new HtmlFormatter();
};

/**
 * creates an HTML report for each file within the given results
 * @param {Array} fileResults mutation results for each file
 * @param {string} baseDir the base directory in which to write the reports
 */
FileHtmlBuilder.prototype.createFileReports = function(fileResults, baseDir) {
    _.forEach(fileResults, function(fileResult) {
        var results = fileResult.mutationResults.sort(mutationComparator),
            mutationResultsTree = convertToTreeStructure(results),
            formattedSource = '',
            formatter = this._htmlFormatter,
            formattedSourceLines = formatter.formatSourceToHtml(fileResult.src, fileResult.src, mutationResultsTree).split('\n'),
            stats = fileResult.stats;


        _.forEach(formattedSourceLines, function(line){
            formattedSource = formattedSource.concat('<li>', line, '</li>');
        });
        var mutations = formatter.formatMutations(fileResult.mutationResults);
        fs.writeFileSync(
            baseDir+"/"+fileResult.fileName+".html",
            fileTemplate({
                style: fs.readFileSync(__dirname + '/templates/file.css', 'utf-8'),
                script: fs.readFileSync(__dirname + '/templates/file.js', 'utf-8'),
                source: '<ol>' + formattedSource + '</ol>',
                mutations: mutations,
                fileName: fileResult.fileName,
                stats: stats,
                coverage: ((stats.all - stats.ignored - stats.untested - stats.survived) / stats.all * 100).toFixed(1)
            }));
    }, this);
};

module.exports = FileHtmlBuilder;

/*
 * compares two mutations allowing a sorter to sort mutations by 'begin' index ascending and 'end' index descending
 */
function mutationComparator(leftSide, rightSide) {
    var sortResult = leftSide.mutation.begin - rightSide.mutation.begin;
    return !!sortResult ? sortResult : rightSide.mutation.end - leftSide.mutation.end; //sort .end descending
}

/**
 * converts the list of (mutation) results into a tree structure. This makes it easier to add HTML tags to the source code at the appropriate places
 * @param {Array} results mutation results
 * @param {string} [parentId] id of the parent mutation, used here to nest mutations
 * @returns {Array} a reduced array, of mutations, each of which contains it's own array possibly filled with child mutations
 */
function convertToTreeStructure(results, parentId) {
    var mutation,
        childResults = [];

    _.forEach(results, function (result) {
        mutation = result.mutation;
        parentId = parentId || mutation.parentMutationId; //initialize parent id if empty
        if (mutation.parentMutationId === parentId) {
            childResults.push(result);
            result.childResults = convertToTreeStructure(results, mutation.mutationId);
        }
    });
    return childResults;
}

