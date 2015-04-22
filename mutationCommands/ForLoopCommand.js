/**
 * This command creates mutations on a given for loop
 * Created by Martin Koster on 24/02/15.
 */
var IterationCommand = require('./IterationCommand');


function MutateForLoopCommand (src, subTree, callback) {
    IterationCommand.call(this, src, subTree, callback);
}

MutateForLoopCommand.prototype.execute = function () {
    return ([
        // only return the 'body' and 'init' nodes as mutating either 'test' or 'update' nodes introduce too great a risk of resulting in an infinite loop
        {node: this._astNode.init, parentMutationId: this._parentMutationId, loopVariables: this._loopVariables},
        {node: this._astNode.body, parentMutationId: this._parentMutationId, loopVariables: this._loopVariables}
    ]);
};

module.exports = MutateForLoopCommand;
