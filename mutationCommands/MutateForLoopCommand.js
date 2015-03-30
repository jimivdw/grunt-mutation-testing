/**
 * Created by Martin Koster on 24/02/15.
 */
var MutateIterationCommand = require('../mutationCommands/MutateIterationCommand');


function MutateForLoopCommand (src, subTree, callback) {
    MutateIterationCommand.call(this, src, subTree, callback);
}

MutateForLoopCommand.prototype.execute = function () {
    return ([
        // only return the 'body' and 'init' nodes as mutating either 'test' or 'update' nodes introduces too great a risk of resulting in an infinite loop
        {node: this._astNode.init, parentMutationId: this._parentMutationId, loopVariables: this._loopVariables},
        {node: this._astNode.body, parentMutationId: this._parentMutationId, loopVariables: this._loopVariables}
    ]);
};

module.exports = MutateForLoopCommand;
