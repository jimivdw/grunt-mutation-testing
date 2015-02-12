/**
 * This command creates mutations on a given array
 * Created by Martin Koster on 2/12/15.
 */
var _ = require('lodash');
var Utils = require('../utils/MutationUtils');
var MutateBaseCommand = require('../mutationCommands/MutateBaseCommand');
var MutateArrayCommand = function (src, astNode, callback, parentMutationId) {
    MutateBaseCommand.call(this, src, astNode, callback, parentMutationId);
};

MutateArrayCommand.prototype.execute = function () {
    var mutation,
        childNodes = [];

    _.forEach(this._astNode, function (childNode) {
        mutation = Utils.createMutation(childNode, childNode.range[1], this._parentMutationId);
        this._callback(mutation);
        childNodes.push({node: childNode, parentMutationId: mutation.mutationId});
    }, this);
    return childNodes;
};

module.exports = MutateArrayCommand;
