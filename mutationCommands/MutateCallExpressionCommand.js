/**
 * This command creates mutations on the parameters of a function call.
 * Please note: any parameters that are actually literals are processed via the MutateLiteralCommand
 * Created by Martin Koster on 2/16/15.
 */
var MutateBaseCommand = require('../mutationCommands/MutateBaseCommand');
var Utils = require('../utils/MutationUtils');
var LiteralUtils = require('../utils/LiteralUtils');
function MutateCallExpressionCommand (src, subTree, callback) {
    MutateBaseCommand.call(this, src, subTree, callback);
}

MutateCallExpressionCommand.prototype.execute = function () {
    var astNode = this._astNode,
        parentMutationId = this._parentMutationId,
        callback = this._callback,
        args = astNode.arguments,
        astChildNodes = [],
        replacement;

    args.forEach(function (arg) {
        var replacement = LiteralUtils.determineReplacement(arg.value);
        var mutation;
        if (arg.type === 'Literal' && !!replacement) {
            // we have found a literal mutation for this argument, so we don't need to mutate more
            mutation = Utils.createMutation(arg, arg.range[1], parentMutationId, replacement);
            callback(mutation);
            return;
        }
        callback(mutation || Utils.createMutation(arg, arg.range[1], parentMutationId, '"MUTATION!"'));
        astChildNodes.push({node: arg, parentMutationId: parentMutationId, loopVariables: this._loopVariables});
    });

    if (args.length === 1) {
        replacement = this._src.substring(args[0].range[0], args[0].range[1]);
        callback(Utils.createMutation(astNode, astNode.range[1], parentMutationId, replacement));
    }

    if (astNode.callee.type === 'MemberExpression') {
        replacement = this._src.substring(astNode.callee.object.range[0], astNode.callee.object.range[1]);
        callback(Utils.createMutation(astNode, astNode.range[1], parentMutationId, replacement));
    }

    astChildNodes.push({node: astNode.callee, parentMutationId: parentMutationId});
    return astChildNodes;
};

module.exports = MutateCallExpressionCommand;
module.exports.code = 'METHOD_CALL';
