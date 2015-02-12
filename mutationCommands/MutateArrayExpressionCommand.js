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
    var elements = this._astNode.elements,
        subNodes = [];

    _.each(elements, function (element, i) {
        var mutation = Utils.createAstArrayElementDeletionMutation(elements, element, i, this._parentMutationId);
        this._callback(mutation);
        subNodes.push({node: element, parentMutationId: mutation.mutationId});
    }, this);
    return subNodes;
};

module.exports = MutateArrayCommand;
