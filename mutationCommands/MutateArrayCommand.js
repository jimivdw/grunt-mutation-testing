/**
 * This command creates mutations on a given array
 * Created by Martin Koster on 2/12/15.
 */
var _ = require('lodash');
var Utils = require('../utils/MutationUtils');
var MutateBaseCommand = require('../mutationCommands/MutateBaseCommand');
function MutateArrayCommand (src, astNode, callback, parentMutationId) {
    MutateBaseCommand.call(this, src, astNode, callback, parentMutationId);
}

MutateArrayCommand.prototype.execute = function () {
    var mutation,
        subTree = [];

    _.forEach(this._astNode, function (childNode, i) {
        mutation = Utils.createMutation(childNode, childNode.range[1], this._parentMutationId);
        this._callback(mutation);
        subTree.push({node: childNode, parentMutationId: mutation.mutationId});
    }, this);
    return subTree;
};

module.exports = MutateArrayCommand;
module.exports.config = 'BLOCK_STATEMENT';
