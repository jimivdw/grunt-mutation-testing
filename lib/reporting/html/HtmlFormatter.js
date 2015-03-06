/**
 * This class exposes a number of formatting methods for adding specific markup to code text and mutation results
 *
 * Created by Martin Koster on 06/03/15.
 */
var HandleBars = require('handlebars'),
    _ = require('lodash');

var codeTemplate = HandleBars.compile('<span class="{{classes}}">{{{code}}}</span>');
var mutationTemplate = HandleBars.compile('<div id="{{mutationId}}" class="{{mutationStatus}}">{{mutationText}}</div>');
var HtmlFormatter = function() {};

/**
 * formats the list of mutations to display on the
 * @returns {string} markup with all mutations to be displayed
 */
HtmlFormatter.prototype.formatMutations = function (mutationResults) {
    var formattedMutations = '',
        orderedResults = mutationResults.sort(function(left, right) {
            return left.mutation.line - right.mutation.line;
        });
    _.forEach(orderedResults, function(mutationResult){
        var mutationHtml = mutationTemplate({
            mutationId: getMutationId(mutationResult.mutation),
            mutationStatus: mutationResult.survived ? 'survived' : 'killed',
            mutationText: mutationResult.message
        });
        formattedMutations = formattedMutations.concat(mutationHtml);
    });
    return formattedMutations;
};

/**
 * recursively format the source code by passing the code snippet found through a mutation node together with hat mutaion node to this function
 * @param {string} source the original source code, never changes
 * @param {string} snippet the code snippet to be formatted (initially all of the code)
 * @param {Array} mutationResults an array of nested mutation results
 * @returns {string} the source code formatted with markup in to the places where mutations have taken place
 */
HtmlFormatter.prototype.formatSourceToHtml = function(source, snippet, mutationResults) {
    var formattedSource = snippet,
        mutation,
        parts,
        mutatedSource,
        childSnippet,formattedChildSnippet;

    _.forEach(mutationResults, function(mutationResult){
        mutation = mutationResult.mutation;
        mutatedSource = source.substr(mutation.begin, mutation.end - mutation.begin);

        childSnippet = mutationResult.childResults.length ? this.formatSourceToHtml(source, mutatedSource, mutationResult.childResults) : mutatedSource;
        formattedChildSnippet = this.formatMultilineSnippet(childSnippet, mutationResult);
        parts = this.removeFirstMutatedSnippetFromRawSource(formattedSource, mutatedSource);
        formattedSource = parts.left + formattedChildSnippet + parts.right;
    }, this);
    return formattedSource;
};

/**
 * removes the first occurrence of the mutated snipped from the unformatted source and returns the code to the left and the right of the snippet
 * @param {string} rawSource the source that can contain both substrings which are formatted with markup and substrings which aren't. We're interested in the latter
 * @param {string} mutatedSource the code snippet that has undergone mutation
 * @returns {{left: string, right: string}} the parts of the source adjacent to the mutated snippet
 */
HtmlFormatter.prototype.removeFirstMutatedSnippetFromRawSource = function(rawSource, mutatedSource) {
    var index = rawSource.lastIndexOf('</span>'),
        alreadyFormatted = rawSource.substr(0, index > 0 ? index : 0),
        parts = rawSource.substring(index < 0 ? 0 : index).split(mutatedSource);
    return {left: alreadyFormatted + parts.shift(), right: parts.join(mutatedSource)};
};

/**
 * formats a multi line snippet in such a way that each line gets encased in its own set of html tags,
 * preventing contents of a <span> to be broken up with <li> tags
 * @param {string} snippet can be multiline - if it isn't the snippet is treated as a whole
 * @param {object} mutationResult contains the mutation relevant to this snippet
 * @returns {string} markup containing the code
 */
HtmlFormatter.prototype.formatMultilineSnippet = function(snippet, mutationResult) {
    var parts = snippet.split(/[\r]?\n/g),
        classes = 'code'.concat(mutationResult.survived ? ' survived ' : ' killed ', getMutationId(mutationResult.mutation)),
        result = '';

    _.forEach(parts, function(part) {
        result.concat(codeTemplate({classes: classes, code: part}), '\n');
    });

    return codeTemplate({classes: classes, code: result || snippet});
};

/* creates a mutation id from the given mutation result */
function getMutationId(mutation) {
    return 'mutation_' + mutation.begin + '_' + mutation.end;
}

module.exports = HtmlFormatter;
