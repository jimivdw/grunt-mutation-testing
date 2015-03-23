/**
 * This class exposes a number of formatting methods for adding specific markup to code text and mutation results
 *
 * Created by Martin Koster on 06/03/15.
 */
var HandleBars = require('handlebars'),
    Mutator = require('../../Mutator'),
    _ = require('lodash');

var codeTemplate = HandleBars.compile('<span class="{{classes}}">{{{code}}}</span>');
var mutationTemplate = HandleBars.compile('<div id="{{mutationId}}" class="{{mutationStatus}}">{{mutationText}}</div>');
var MUTATIONSTART = '@mutation:start';
var MUTATIONEND = '@mutation:end';
var HtmlFormatter = function(src) {
    this._src = src;
    this._mutator = new Mutator(src);
};

function instrumentSource(mutationResults) {
    _.forEach(mutationResults, function (mutationResult) {
        var mutation = mutationResult.mutation,
            mutationId = getMutationId(mutation),
            mutatedNode = this._mutator.findNodeForMutation(mutation);

        if (mutatedNode) {
            mutatedNode.leadingComments = (mutatedNode.leadingComments || []).concat({type: 'Block', value: MUTATIONSTART + '#' + mutationId});
            mutatedNode.trailingComments = (mutatedNode.trailingComments || []).concat({type: 'Block', value: MUTATIONEND + '#' + mutationId});
        }
    }, this);

    return this._mutator.serializeAST();
}

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
 * recursively format the source code by passing a list of mutation node and the code fragment belonging to them to this function
 * @param {[object]} mutationNodes an array of nested mutation results
 * @param {string} [mutatedFragment] the code fragment to be formatted (initially all of the code)
 * @returns {string} the source code formatted with markup in to the places where mutations have taken place
 */
HtmlFormatter.prototype.formatSourceToHtml = function (mutationResults){
    var instrumentedSource = instrumentSource.call(this, mutationResults),
        formattedSource = instrumentedSource,
        mutationStartRegex = /\/\*@mutation:start#(.*)\*\//g,
        contentRegexString = '\\/\\*@mutation:start#${id}.*\\*\\/([\\S\\s]*)\\/\\*@mutation:end#${id}\\*\\/',
        mutationStart = mutationStartRegex.exec(formattedSource),
        mutationId, contentMatch;

    while (mutationStart) {
        mutationId = mutationStart[1];
        contentMatch = new RegExp(contentRegexString.replace(/\$\{id\}/g, mutationId)).exec(formattedSource);
        if (contentMatch) {
            formattedSource = this.formatMultilineFragment(contentMatch[1], mutationResults);
            mutationStart = mutationStartRegex.exec(formattedSource);
        } else {
            throw 'Error! Mutation ID ' + mutationId + ' ought to have matching content';
        }
    }

    return formattedSource;
};

//function x_X(mutationNodes, mutatedFragment) {
//    var source = this._src,
//        formattedSource = mutatedFragment || source,
//        mutation,
//        parts,
//        mutatedSource,
//        childFragment;
//
//    _.forEach(mutationNodes, function(mutationResult, i){
//        mutation = mutationResult.mutation;
//        mutatedSource = source.substr(mutation.begin, mutation.end - mutation.begin);
//
//        childFragment = mutationResult.childResults.length ? this.formatSourceToHtml(mutationResult.childResults, mutatedSource) : mutatedSource;
//        parts = this.removeFirstMutatedFragmentFromRawSource(formattedSource, mutatedSource);
//        formattedSource = parts.left + this.formatMultilineFragment(childFragment, mutationResult) + parts.right;
//    }, this);
//    return formattedSource;
//}

///**
// * removes the first occurrence of the mutated fragment from the unformatted source and returns the code to the left and the right of the fragment
// * @param {string} rawSource the source that can contain both substrings which are formatted with markup and substrings which aren't. We're interested in the latter
// * @param {string} mutatedSource the code fragment that has undergone mutation
// * @returns {{left: string, right: string}} the parts of the source adjacent to the mutated fragment
// */
//HtmlFormatter.prototype.removeFirstMutatedFragmentFromRawSource = function(rawSource, mutatedSource) {
//    var index = rawSource.lastIndexOf('</span>'),
//        alreadyFormatted = rawSource.substr(0, index > 0 ? index : 0),
//        parts = rawSource.substring(index < 0 ? 0 : index).split(mutatedSource);
//    return {left: alreadyFormatted + parts.shift(), right: parts.join(mutatedSource)};
//};

/**
 * formats a multi line fragment in such a way that each line gets encased in its own set of html tags,
 * preventing contents of a <span> to be broken up with <li> tags
 * @param {string} fragment can be multiline - if it isn't the fragment is treated as a whole
 * @param {object} mutationResult contains the mutation relevant to this fragment
 * @returns {string} markup containing the code
 */
HtmlFormatter.prototype.formatMultilineFragment = function(fragment, mutationResult) {
    var parts = fragment.split(/[\r]?\n/g),
        classes = 'code'.concat(mutationResult.survived ? ' survived ' : ' killed ', getMutationId(mutationResult.mutation)),
        result = '';

    _.forEach(parts, function(part) {
        result.concat(codeTemplate({classes: classes, code: part}), '\n');
    });

    return codeTemplate({classes: classes, code: result || fragment});
};

/* creates a mutation id from the given mutation result */
function getMutationId(mutation) {
    return 'mutation_' + mutation.mutationId + '_' + mutation.begin + '_' + mutation.end;
}

module.exports = HtmlFormatter;
