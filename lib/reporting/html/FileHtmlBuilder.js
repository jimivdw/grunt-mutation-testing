/**
 * Created by Martin Koster on 3/2/15.
 */
var fs = require('fs'),
    _ = require('lodash'),
    HandleBars = require('handlebars');

var template = HandleBars.compile(fs.readFileSync(__dirname + '/templates/file.html', 'utf-8'));
var killedTemplate = HandleBars.compile('<span class="killed">{{{code}}}</span>');
var survivedTemplate = HandleBars.compile('<span class="survived">{{{code}}}</span>');
var FileHtmlBuilder=  function(source){
    this._source = source;
};

FileHtmlBuilder.prototype.createFileReports = function(fileResults, baseDir) {
    _.forEach(fileResults, function(fileResult) {
		var results = fileResult.result.mutationResults.sort(function(left, right){
            var sortResult = left.mutation.begin - right.mutation.begin;
            return !!sortResult ? sortResult : right.mutation.end - left.mutation.end; //sort .end descending
        });
        console.log('converToTreeStructure', JSON.stringify(results));
        var mutationResultsTree = convertToTreeStructure(results, '1'),
            formattedSourceLines = formatSourceToHtml(fileResult.result.src, fileResult.result.src, mutationResultsTree).split('\n'),
            formattedSource = '';

        //console.log('formattedSource', formattedSourceLines);
        _.forEach(formattedSourceLines, function(line){
            formattedSource = formattedSource.concat('<li>', line, '</li>');
        });
        //console.log('formattedSource', formattedSource);
        fs.writeFileSync(
            baseDir+"/"+fileResult.fileName+".html",
            template({source: '<ol>' + formattedSource + '</ol>'}));
    }, this);
};

module.exports = FileHtmlBuilder;

function convertToTreeStructure(results, parentId) {
    var mutation,
        childResults = [];

    //console.log('converToTreeStructure', parentId);
    _.forEach(results, function (result) {
        //console.log('result', result);
        mutation = result.mutation;
        if (mutation.parentMutationId === parentId) {
            childResults.push(result);
            result.childResults = convertToTreeStructure(results, mutation.mutationId);
        }
    });
    return childResults;
}

function formatSnippet(snippet, mutation) {
    var template = mutation.survived ? survivedTemplate : killedTemplate,
        parts = snippet.split(/[\r]?\n/g),
        result = '';
    //console.log('formatSnippet');

    _.forEach(parts, function(part) {
        result.concat(template({code: part}), '\n');
    });

    return template({code: snippet});
}
function formatSourceToHtml(source, snippet, mutationResults, level) {
    var formattedSource = snippet,
        mutation,
        parts,
        mutatedSource,
        template,
        childSnippet;

    level = level || 1;
    //console.log('\n\n\nformatting to Html, level: ', level, '\n', [source]);
    _.forEach(mutationResults, function(mutationResult){
        mutation = mutationResult.mutation;
        //console.log('mutation begin/end', mutation.begin, mutation.end);
        mutatedSource = source.substr(mutation.begin, mutation.end - mutation.begin);

        parts = formattedSource.split(mutatedSource);
        //console.log('>>> formattedSource: \n\t', formattedSource, '\n>>> mutated source\n\t', mutatedSource, '\n>>> parts\n\t', parts.toString());
        childSnippet = mutationResult.childResults.length ? formatSourceToHtml(source, mutatedSource, mutationResult.childResults, level+1) : mutatedSource;

        //console.log('formatSourceToHtml with snippet:', childSnippet);

        formattedSource = parts[0] + formatSnippet(childSnippet, mutationResult) + (parts.length > 1 ? parts[1] : '');
    });
    return formattedSource;
}
