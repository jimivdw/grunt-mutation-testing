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
        var mutationResultsTree = convertToTreeStructure(fileResult.result.mutationResults, '1');
        console.log('source', fileResult.result._src);
        fs.writeFileSync(
            baseDir+"/"+fileResult.fileName+".html",
            template({source: formatSourceToHtml(fileResult.result.src, fileResult.result.src, mutationResultsTree)}));
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

function formatSourceToHtml(source, snippet, mutationResults, level) {
    var formattedSource = snippet,
        mutation,
        parts,
        mutatedSource,
        template,
        formattedSnippet;

    level = level || 1;
    console.log('\n\n\nformatting to Html, level: ', level, '\n', [source]);
    _.forEach(mutationResults, function(mutationResult){
        mutation = mutationResult.mutation;
        template = mutationResult.survived ? survivedTemplate : killedTemplate;
        console.log('mutation begin/end', mutation.begin, mutation.end);
        mutatedSource = source.substr(mutation.begin, mutation.end - mutation.begin);

        parts = formattedSource.split(mutatedSource);
        console.log('>>> formattedSource: \n\t', formattedSource, '\n>>> mutated source\n\t', mutatedSource, '\n>>> parts\n\t', parts.toString());
        formattedSnippet = mutationResult.childResults.length ? formatSourceToHtml(source, mutatedSource, mutationResult.childResults, level+1) : mutatedSource;

        formattedSource = parts[0] + template({code:formattedSnippet}) + (parts.length > 1 ? parts[1] : '');
    });
    return formattedSource;
}
