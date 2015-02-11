/**
 * The comparison operator command creates mutations on a given comparison operator.
 * Each operator can be mutated to its boundary and its negation counterpart, e.g.
 * '<' has '<=' as boundary and '>=' as negation (opposite)
 * Created by Martin Koster on 2/11/15.
 */
var operators = {
  '+': '-',
  '-': '+',
  '*': '/',
  '/': '*',
  '%': '*'
};

var createOperatorMutation = function (replacement) {
  return {
    begin: this._astNode.left.range[1],
    end: this._astNode.right.range[0],
    line: this._astNode.left.loc.end.line,
    col: this._astNode.left.loc.end.column,
    replacement: replacement
  };
};

var MutateComparisonOperatorCommand = function(astNode, callback) {
  this._astNode = astNode;
  this._callback = callback;
};

MutateComparisonOperatorCommand.prototype.execute = function () {
  console.log(">>> doing arithmetic mutations");
  if (operators.hasOwnProperty(this._astNode.operator)) {
    this._callback(createOperatorMutation.call(this, operators[this._astNode.operator]));
  }
  return [this._astNode.left, this._astNode.right];
};

module.exports = MutateComparisonOperatorCommand;
