/**
 * This command processes default nodes. All it does is expose its child nodes.
 * Created by Martin Koster on 2/12/15.
 */
var _ = require('lodash'),
    ScopeUtils = require('../utils/ScopeUtils');
function MutateBaseCommand(src, subTree, callback) {
    var astNode = subTree.node,
        body = astNode.body;

    /* while selecting a command requires the node, the actual processing may
     * in some cases require the body of the node, which is itself a node */
    this._astNode = body && _.isArray(body) ? body : astNode;
    this._src = src;
    this._callback = callback;
    this._parentMutationId = subTree.parentMutationId;

    if (body && ScopeUtils.hasScopeChanged(astNode)) {
        this._loopVariables = ScopeUtils.removeOverriddenLoopVariables(body, subTree.loopVariables || []);
        if (!_.isEmpty(this._loopVariables )) {
        }
    } else {
        this._loopVariables = subTree.loopVariables || [];
    }
}

MutateBaseCommand.prototype.execute = function () {
    var childNodes = [];
    _.forOwn(this._astNode, function (child) {
        childNodes.push({node: child, parentMutationId: this._parentMutationId, loopVariables: this._loopVariables}); //no own mutations so use parent mutation id
    }, this);
    return childNodes;
};

module.exports = MutateBaseCommand;
