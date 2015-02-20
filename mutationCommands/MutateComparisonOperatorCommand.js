/**
 * This command creates mutations on a given comparison operator.
 * Each operator can be mutated to its boundary and its negation counterpart, e.g.
 * '<' has '<=' as boundary and '>=' as negation (opposite)
 * Created by Martin Koster on 2/11/15.
 */
var MutateBaseCommand = require('../mutationCommands/MutateBaseCommand');
var Utils = require('../utils/MutationUtils');
var operators = {
    '<': {boundary: '<=', negation: '>='},
    '<=': {boundary: '<', negation: '>'},
    '>': {boundary: '>=', negation: '<='},
    '>=': {boundary: '>', negation: '<'},
    '===': {boundary: '==', negation: '!=='},
    '==': {boundary: '===', negation: '!='},
    '!==': {boundary: '!=', negation: '==='},
    '!=': {boundary: '!==', negation: '=='}
};

var MutateComparisonOperatorCommand = function (src, astNode, callback, parentMutationId) {
    MutateBaseCommand.call(this, src, astNode, callback, parentMutationId);
};

MutateComparisonOperatorCommand.prototype.execute = function () {
    if (operators.hasOwnProperty(this._astNode.operator)) {
        var boundaryOperator = operators[this._astNode.operator].boundary;
        var negationOperator = operators[this._astNode.operator].negation;

        if (!!boundaryOperator) {
            this._callback(Utils.createOperatorMutation(this._astNode, this._parentMutationId, boundaryOperator));
        }

        if (!!negationOperator) {
            this._callback(Utils.createOperatorMutation(this._astNode, this._parentMutationId, negationOperator));
        }
    }
    return [
        {node: this._astNode.left, parentMutationId: this._parentMutationId}, //mutations on left and right nodes aren't sub-mutations of this so use parent mutation id
        {node: this._astNode.right, parentMutationId: this._parentMutationId}
    ];
};

module.exports = MutateComparisonOperatorCommand;
module.exports.code = 'COMPARISON';
