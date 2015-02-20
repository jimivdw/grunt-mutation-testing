/**
 * This command creates mutations on a given object
 * Created by Martin Koster on 2/12/15.
 */
var _ = require('lodash');
var MutateBaseCommand = require('../mutationCommands/MutateBaseCommand');
var Utils = require('../utils/MutationUtils');
var MutateObjectCommand = function (src, astNode, callback, parentMutationId) {
    MutateBaseCommand.call(this, src, astNode, callback, parentMutationId);
};

MutateObjectCommand.prototype.execute = function () {
    var properties = this._astNode.properties,
        subNodes = [];

    _.forEach(properties, function (property, i) {
        var mutation;
        if (property.kind === 'init') {
            mutation = Utils.createAstArrayElementDeletionMutation(properties, property, i, this._parentMutationId);
            this._callback(mutation);
        }
        subNodes.push({node: property.value, parentMutationId: mutation.mutationId});
    }, this);
    return subNodes;
};

module.exports = MutateObjectCommand;
module.exports.code = 'OBJECT';
