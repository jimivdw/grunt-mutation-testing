/**
 * Created by Martin Koster on 2/16/15.
 */
var MutateBaseCommand = require('../mutationCommands/MutateBaseCommand');
var Utils = require('../utils/MutationUtils');
var MutateDecrementIncrementOperatorCommand = function (src, astNode, callback, parentMutationId) {
    MutateBaseCommand.call(this, src, astNode, callback, parentMutationId);
};

MutateDecrementIncrementOperatorCommand.prototype.execute = function () {
    var astNode = this._astNode,
        updateOperatorMutation,
        updateOperatorReplacements = {
            '++': '--',
            '--': '++'
        };

    if (updateOperatorReplacements.hasOwnProperty(astNode.operator)) {
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

module.exports = MutateDecrementIncrementOperatorCommand;
