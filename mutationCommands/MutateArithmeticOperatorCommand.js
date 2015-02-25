/**
 * This command creates mutations on a given arithmetic operator.
 * Each operator will be mutated to it's opposite
 * Created by Martin Koster on 2/11/15.
 */
var MutateBaseCommand = require('../mutationCommands/MutateBaseCommand'),
    _ = require('lodash');
var Utils = require('../utils/MutationUtils');
var operators = {
    '+': '-',
    '-': '+',
    '*': '/',
    '/': '*',
    '%': '*'
};

function MutateArithmeticOperatorCommand(src, subTree, callback) {
    MutateBaseCommand.call(this, src, subTree, callback);
}

MutateArithmeticOperatorCommand.prototype.execute = function () {
    if (operators.hasOwnProperty(this._astNode.operator)) {
        this._callback(Utils.createOperatorMutation(this._astNode, this._parentMutationId, operators[this._astNode.operator]));
    }
    return [
        {node: this._astNode.left, parentMutationId: this._parentMutationId, loopVariables: this._loopVariables},
        {node: this._astNode.right, parentMutationId: this._parentMutationId, loopVariables: this._loopVariables}];
};

module.exports = MutateArithmeticOperatorCommand;
module.exports.code = 'MATH';
module.exports.exclude = true;
