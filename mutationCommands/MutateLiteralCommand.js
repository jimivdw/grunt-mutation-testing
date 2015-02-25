/**
 * This command performs mutations on literals of type string, number of boolean
 * Created by Martin Koster on 2/12/15.
 */
var _ = require('lodash');
var Utils = require('../utils/MutationUtils');
var LiteralUtils = require('../utils/LiteralUtils');
var MutateBaseCommand = require('../mutationCommands/MutateBaseCommand');
function MutateLiteralCommand (src, subTree, callback) {
    MutateBaseCommand.call(this, src, subTree, callback);
}

MutateLiteralCommand.prototype.execute = function () {
    var literalValue = this._astNode.value,
        replacement = LiteralUtils.determineReplacement(literalValue);

    if (replacement) {
        this._callback(Utils.createMutation(this._astNode, this._astNode.range[1], this._parentMutationId, replacement));
    }

    return [];
};

module.exports = MutateLiteralCommand;
module.exports.code = 'LITERAL';
