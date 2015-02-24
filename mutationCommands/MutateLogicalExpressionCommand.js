/**
 * This command creates mutations on logical operators.
 *
 * Created by Merlin Weemaes on 2/24/15.
 */
var MutateBaseCommand = require('../mutationCommands/MutateBaseCommand'),
    _ = require('lodash');
var Utils = require('../utils/MutationUtils');
var operators = {
    '&&': '||',
    '||': '&&'
};

function MutateLogicalExpressionCommand(src, astNode, callback, parentMutationId) {
    MutateBaseCommand.call(this, src, astNode, callback, parentMutationId);
}

MutateLogicalExpressionCommand.prototype.execute = function () {

    if (operators.hasOwnProperty(this._astNode.operator)) {
        this._callback(Utils.createOperatorMutation(this._astNode, this._parentMutationId, operators[this._astNode.operator]));
    }

    return [
        {node: this._astNode.left, parentMutationId: this._parentMutationId},
        {node: this._astNode.right, parentMutationId: this._parentMutationId}];
};

module.exports = MutateLogicalExpressionCommand;
