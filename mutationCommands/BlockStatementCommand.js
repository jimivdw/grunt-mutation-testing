/**
 * This command creates mutations on a given array
 * Created by Martin Koster on 2/12/15.
 */
var _ = require('lodash');
var Utils = require('../utils/MutationUtils');
var BaseCommand = require('./BaseCommand');
function MutateBlockStatementCommand (src, subTree, callback) {
    BaseCommand.call(this, src, subTree, callback);
}

MutateBlockStatementCommand.prototype.execute = function () {
    var mutation,
        subTree = [];

    _.forEach(this._astNode, function (childNode) {
        mutation = Utils.createMutation(childNode, childNode.range[1], this._parentMutationId);
        this._callback(mutation);
        subTree.push({node: childNode, parentMutationId: mutation.mutationId, loopVariables: this._loopVariables});
    }, this);
    return subTree;
};

module.exports = MutateBlockStatementCommand;
module.exports.code = 'BLOCK_STATEMENT';
