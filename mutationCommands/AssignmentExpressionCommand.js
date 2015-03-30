/**
 * This command handles Assignment expressions.
 * While not creating ant mutations, it does check whether the RHS of the assignment is eligible for mutations.
 * If not the buck stops here, i.e. no child nodes are returned. The main reason for doing this is to prevent
 * mutated assignments to loop variables from causing endless loops
 * Created by Martin Koster on 2/26/15.
 */
var _ = require('lodash'),
    MutateBaseCommand = require('./MutateBaseCommand'),
    escodegen = require('escodegen');

function AssignmentExpressionCommand (src, subTree, callback) {
    MutateBaseCommand.call(this, src, subTree, callback)
};

AssignmentExpressionCommand.prototype.execute = function() {
    var childNodes = [];
    if (canMutate(this)) {
        _.forOwn(this._astNode, function (child) {
            childNodes.push({node: child, parentMutationId: this._parentMutationId, loopVariables: this._loopVariables});
        }, this);
    }
    return childNodes;
};

function canMutate(ctx) {
    var canMutate = false,
        left = ctx._astNode.left,
        right = ctx._astNode.right;
    if (left && (left.type === 'Identifier' || left.type === 'MemberExpression')) {
        canMutate = canMutate || (ctx._loopVariables.indexOf(escodegen.generate(left)) < 0);
    }
    if (right && (right.type === 'Identifier' || right.type === 'MemberExpression')) {
        canMutate = canMutate || (ctx._loopVariables.indexOf(escodegen.generate(right)) < 0);
    }
    return canMutate;
}
module.exports = AssignmentExpressionCommand;
