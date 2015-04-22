/**
 * This command creates mutations on a given iteration
 * Created by Martin Koster on 24/02/15.
 */
var esprima = require('esprima'),
    escodegen = require('escodegen'),
    _ = require('lodash'),
    BaseCommand = require('./BaseCommand');


function findLoopVariables(testNode) {
    var tokens = esprima.tokenize(escodegen.generate(testNode));

    return _.pluck(_.filter(tokens, {'type': 'Identifier'}), 'value');
}

function MutateIterationCommand (src, subTree, callback) {
    BaseCommand.call(this, src, subTree, callback);
    this._loopVariables = _.merge(this._loopVariables, findLoopVariables(this._astNode.test));
}

MutateIterationCommand.prototype.execute = function () {
    return ([
        // only return the 'body' node as mutating 'test' node introduces too great a risk of resulting in an infinite loop
        {node: this._astNode.body, parentMutationId: this._parentMutationId, loopVariables: this._loopVariables}
    ]);
};

module.exports = MutateIterationCommand;
