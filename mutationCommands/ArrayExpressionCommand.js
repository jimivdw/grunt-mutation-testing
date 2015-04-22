/**
 * This command creates mutations on a given array
 * Created by Martin Koster on 2/12/15.
 */
var _ = require('lodash');
var Utils = require('../utils/MutationUtils');
var BaseCommand = require('./BaseCommand');
function MutateArrayCommand (src, subTree, callback) {
    BaseCommand.call(this, src, subTree, callback);
}

MutateArrayCommand.prototype.execute = function () {
    var elements = this._astNode.elements,
        subNodes = [];

    _.each(elements, function (element, i) {
        var mutation = Utils.createAstArrayElementDeletionMutation(elements, element, i, this._parentMutationId);
        this._callback(mutation);
        subNodes.push({node: element, parentMutationId: mutation.mutationId, loopVariables: this._loopVariables});
    }, this);
    return subNodes;
};

module.exports = MutateArrayCommand;
module.exports.code = 'ARRAY';
