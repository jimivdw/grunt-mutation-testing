/**
 * Created by Martin Koster on 3/2/15.
 */
var fs = require('fs'),
    _ = require('lodash'),
    HandleBars = require('handlebars');

var fileTemplate = HandleBars.compile(fs.readFileSync(__dirname + '/templates/file.html', 'utf-8'));
var codeTemplate = HandleBars.compile('<span class="{{classes}}">{{{code}}}</span>');
var mutationTemplate = HandleBars.compile('<div id="{{mutationId}}" class="{{mutationStatus}}">{{mutationText}}</div>');
var FileHtmlBuilder=  function(){};

FileHtmlBuilder.prototype.createFileReports = function(fileResults, baseDir) {
    _.forEach(fileResults, function(fileResult) {
		var stats = fileResult.stats,
            results = fileResult.mutationResults.sort(function (left, right) {
                var sortResult = left.mutation.begin - right.mutation.begin;
                return !!sortResult ? sortResult : right.mutation.end - left.mutation.end; //sort .end descending
            });

        //console.log('convertToTreeStructure', JSON.stringify(results));
        var mutationResultsTree = convertToTreeStructure(results),
            formattedSourceLines = formatSourceToHtml(fileResult.src, fileResult.src, mutationResultsTree).split('\n'),
            formattedSource = '';

        _.forEach(formattedSourceLines, function(line){
            formattedSource = formattedSource.concat('<li>', line, '</li>');
        });
        fs.writeFileSync(
            baseDir+"/"+fileResult.fileName+".html",
            fileTemplate({
                style: fs.readFileSync(__dirname + '/templates/file.css', 'utf-8'),
                script: fs.readFileSync(__dirname + '/templates/file.js', 'utf-8'),
                source: '<ol>' + formattedSource + '</ol>',
                mutations: formatMutations(fileResult.mutationResults),
                fileName: fileResult.fileName,
                stats: stats,
                coverage: ((stats.all - stats.ignored - stats.untested - stats.survived) / stats.all * 100).toFixed(1)
            }));
    }, this);
};

module.exports = FileHtmlBuilder;

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

function formatSnippet(snippet, mutationResult) {
    var parts = snippet.split(/[\r]?\n/g),
        classes = 'code'.concat(mutationResult.survived ? ' survived' : ' killed', ' mutation_', mutationResult.mutation.begin, '_', mutationResult.mutation.end),
        result = '';

    _.forEach(parts, function(part) {
        result.concat(codeTemplate({classes: classes, code: part}), '\n');
    });

    return codeTemplate({classes: classes, code: result || snippet});
}

function formatSourceToHtml(source, snippet, mutationResults, level) {
    var formattedSource = snippet,
        mutation,
        parts,
        mutatedSource,
        childSnippet;

    level = level || 1;
    _.forEach(mutationResults, function(mutationResult){
        mutation = mutationResult.mutation;
        mutatedSource = source.substr(mutation.begin, mutation.end - mutation.begin);

        parts = formattedSource.split(mutatedSource);
        childSnippet = mutationResult.childResults.length ? formatSourceToHtml(source, mutatedSource, mutationResult.childResults, level+1) : mutatedSource;

        formattedSource = parts[0] + formatSnippet(childSnippet, mutationResult) + (parts.length > 1 ? parts[1] : '');
    });
    return formattedSource;
}

function formatMutations(mutationResults) {
    var formattedMutations = '';
    _.forEach(mutationResults, function(mutationResult){
        var mutationHtml = mutationTemplate({
            mutationId: 'mutation_' + mutationResult.mutation.begin + '_' + mutationResult.mutation.end,
            mutationStatus: mutationResult.survived ? 'survived' : 'killed',
            mutationText: mutationResult.message
        });
        formattedMutations = formattedMutations.concat(mutationHtml);
    });
    //console.log('mutations', formattedMutations);
    return formattedMutations;
}
