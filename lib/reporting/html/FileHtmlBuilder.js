/**
 * Builds the HTML for each file in the given results
 * Created by Martin Koster on 3/2/15.
 */
var fs = require('fs'),
    _ = require('lodash'),
    HandleBars = require('handlebars');

var fileTemplate = HandleBars.compile(fs.readFileSync(__dirname + '/templates/file.html', 'utf-8'));
var codeTemplate = HandleBars.compile('<span class="{{classes}}">{{{code}}}</span>');
var mutationTemplate = HandleBars.compile('<div id="{{mutationId}}" class="{{mutationStatus}}">{{mutationText}}</div>');
var FileHtmlBuilder=  function(){};

/**
 * creates an HTML report for each file within the given results
 * @param {array} fileResults mutation results for each file
 * @param {string} baseDir the base directory in which to write the reports
 */
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
        var mutations = formatMutations(fileResult.mutationResults);
        console.log(formattedSource);
        console.log(mutations);
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

/**
 * converts the list of (mutation) results into a tree structure. This makes it easier to add HTML tags to the source code at the appropriate places
 * @param {array} results mutation results
 * @param {string} [parentId] id of the parent mutation, used here to nest mutations
 * @returns {array} a reduced array, of mutations, each of which contains it's own array possibly filled with child mutations
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

/**
 * recursively format the source code by passing the code snippet found through a mutation node together with hat mutaion node to this function
 * @param {string} source the original source code, never changes
 * @param {string} snippet the code snippet to be formatted (initially all of the code)
 * @param {array} mutationResults an array of mutation results that are sub results of the mutation result used to find 'snippet'
 * @returns {string} the source code formatted with markup in to the places where mutations have taken place
 */
function formatSourceToHtml(source, snippet, mutationResults) {
    var formattedSource = snippet,
        mutation,
        parts,
        mutatedSource,
        childSnippet,formattedChildSnippet;

    _.forEach(mutationResults, function(mutationResult){
        mutation = mutationResult.mutation;
        mutatedSource = source.substr(mutation.begin, mutation.end - mutation.begin);

        childSnippet = mutationResult.childResults.length ? formatSourceToHtml(source, mutatedSource, mutationResult.childResults) : mutatedSource;
        formattedChildSnippet = formatMultilineSnippet(childSnippet, mutationResult);
        parts = removeFirstMutatedSnippetFromRawSource(formattedSource, mutatedSource);
        formattedSource = parts.left + formattedChildSnippet + parts.right;
    });
    return formattedSource;
}

/**
 * removes the first occurrence of the mutated snipped from the unformatted source and returns the code to the left and the right of the snippet
 * @param {string} rawSource the source that can contain both substrings which are formatted with markup and substrings which aren't. We're interested in the latter
 * @param {string} mutatedSource the code snippet that has undergone mutation
 * @returns {{left: string, right: string}} the parts of the source adjacent to the mutated snippet
 */
function removeFirstMutatedSnippetFromRawSource(rawSource, mutatedSource) {
    var index = rawSource.lastIndexOf('</span>'),
        alreadyFormated = rawSource.substr(0, index > 0 ? index : 0),
        parts = rawSource.substring(index < 0 ? 0 : index).split(mutatedSource);
    return {left: alreadyFormated + parts.shift(), right: parts.join(mutatedSource)};
}

/**
 * formats a multi line snippet in such a way that each line gets encased in its own set of html tags,
 * preventing contents of a <span> to be broken up with <li> tags
 * @param {string} snippet can be multiline - if it isn't the snippet is treated as a whole
 * @param {object} mutationResult contains the mutation relevant to this snippet
 * @returns {string} markup containing the code
 */
function formatMultilineSnippet(snippet, mutationResult) {
    var parts = snippet.split(/[\r]?\n/g),
        classes = 'code'.concat(mutationResult.survived ? ' survived ' : ' killed ', getMutationId(mutationResult)),
        result = '';

    _.forEach(parts, function(part) {
        result.concat(codeTemplate({classes: classes, code: part}), '\n');
    });

    return codeTemplate({classes: classes, code: result || snippet});
}

/**
 * formats the list of mutations to display on the
 * @param {array} mutationResults the results to be displayed
 * @returns {string} markup with all mutations to be displayed
 */
function formatMutations(mutationResults) {
    var formattedMutations = '',
        orderedResults = mutationResults.sort(function(left, right) {
            return left.mutation.line - right.mutation.line;
        });
    _.forEach(orderedResults, function(mutationResult){
        var mutationHtml = mutationTemplate({
            mutationId: getMutationId(mutationResult),
            mutationStatus: mutationResult.survived ? 'survived' : 'killed',
            mutationText: mutationResult.message
        });
        formattedMutations = formattedMutations.concat(mutationHtml);
    });
    return formattedMutations;
}

function getMutationId(mutationResult) {
    return 'mutation_' + mutationResult.mutation.begin + '_' + mutationResult.mutation.end;
}
