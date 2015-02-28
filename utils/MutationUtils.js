/**
 * Created by Martin Koster on 2/16/15.
 */
var _ = require('lodash');

var createMutation = function (astNode, endOffset, parentMutationId, replacement) {
    replacement = replacement || '';
    return {
        begin: astNode.range[0],
        end: endOffset,
        line: astNode.loc.start.line,
        col: astNode.loc.start.column,
        parentMutationId: parentMutationId,
        mutationId: _.uniqueId(),
        replacement: replacement
    };
};

var createAstArrayElementDeletionMutation = function (astArray, element, elementIndex, parentMutationId) {
    var endOffset = (elementIndex === astArray.length - 1) ? // is last element ?
        element.range[1] :                     // handle last element
        astArray[elementIndex + 1].range[0];   // care for commas by extending to start of next element
    return createMutation(element, endOffset, parentMutationId);
};

var createOperatorMutation = function (astNode, parentMutationId, replacement) {
    return {
        begin: astNode.left.range[1],
        end: astNode.right.range[0],
        line: astNode.left.loc.end.line,
        col: astNode.left.loc.end.column,
        mutationId: _.uniqueId(),
        parentMutationId: parentMutationId,
        replacement: replacement
    };
};

module.exports.createMutation = createMutation;
module.exports.createAstArrayElementDeletionMutation = createAstArrayElementDeletionMutation;
module.exports.createOperatorMutation = createOperatorMutation;
