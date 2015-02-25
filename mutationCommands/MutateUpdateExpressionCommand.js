/**
 * Created by Martin Koster on 2/16/15.
 */
var MutateBaseCommand = require('../mutationCommands/MutateBaseCommand');
var Utils = require('../utils/MutationUtils');
function MutateUpdateExpressionCommand (src, subTree, callback) {
    MutateBaseCommand.call(this, src, subTree, callback);
}

MutateUpdateExpressionCommand.prototype.execute = function () {
    var astNode = this._astNode,
        updateOperatorMutation,
        updateOperatorReplacements = {
            '++': '--',
            '--': '++'
        };

    if (canMutate(this._astNode, this._loopVariables) && updateOperatorReplacements.hasOwnProperty(astNode.operator)) {
        var replacement = updateOperatorReplacements[astNode.operator];

        if (astNode.prefix) {
            // e.g. ++x
            updateOperatorMutation = Utils.createMutation(astNode, astNode.argument.range[0], this._parentMutationId, replacement);
        } else {
            // e.g. x++
            updateOperatorMutation = {
                begin: astNode.argument.range[1],
                end: astNode.range[1],
                line: astNode.loc.end.line,
                col: astNode.argument.loc.end.column,
                replacement: replacement
            };
        }

        this._callback(updateOperatorMutation);
    }

    return [];
};

function canMutate(astNode, loopVariables) {
    return (loopVariables.indexOf(astNode.argument.name) < 0);
}

module.exports = MutateUpdateExpressionCommand;
module.exports.code = 'UPDATE_EXPRESSION';
module.exports.exclude = true;
