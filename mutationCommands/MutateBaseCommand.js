/**
 * This command processes default nodes. All it does is expose its child nodes.
 * Created by Martin Koster on 2/12/15.
 */
var _ = require('lodash');
function MutateBaseCommand (src, astNode, callback, parentMutationId) {
    this._src = src;
    this._astNode = astNode;
    this._callback = callback;
    this._parentMutationId = parentMutationId;
}

MutateBaseCommand.prototype.execute = function () {
    var subNodes = [];
    _.forOwn(this._astNode, function (child) {
        subNodes.push({node: child, parentMutationId: this._parentMutationId}); //no own mutations so use parent mutation id
    }, this);
    return subNodes;
};

module.exports = MutateBaseCommand;
