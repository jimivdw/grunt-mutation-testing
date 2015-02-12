/**
 * This command performs mutations on literals of type string, number of boolean
 * Created by Martin Koster on 2/12/15.
 */
var _ = require('lodash');
var Utils = require('../utils/MutationUtils');
var LiteralUtils = require('../utils/LiteralUtils');
var MutateBaseCommand = require('../mutationCommands/MutateBaseCommand');
var MutateLiteralCommand = function (src, astNode, callback, parentMutationId) {
    MutateBaseCommand.call(this, src, astNode, callback, parentMutationId);
};


MutateLiteralCommand.prototype.execute = function () {
    var literalValue = this._astNode.value,
        replacement = LiteralUtils.determineReplacement(literalValue);

    if (replacement) {
        this._callback(Utils.createMutation(this._astNode, this._astNode.range[1], this._parentMutationId, replacement));
    }

    return [];
};

module.exports = MutateLiteralCommand;
