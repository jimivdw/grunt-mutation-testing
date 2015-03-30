/**
 * Created by Martin Koster on 24/02/15.
 */
var esprima = require('esprima'),
    escodegen = require('escodegen'),
    _ = require('lodash'),
    MutateBaseCommand = require('../mutationCommands/MutateBaseCommand');


function MutateIterationCommand (src, subTree, callback) {
    MutateBaseCommand.call(this, src, subTree, callback);
    this._loopVariables = _.merge(this._loopVariables, findLoopVariables(this._astNode.test));
}

MutateIterationCommand.prototype.execute = function () {
    return ([
        // only return the 'body' node as mutating 'test' node introduces too great a risk of resulting in an infinite loop
        {node: this._astNode.body, parentMutationId: this._parentMutationId, loopVariables: this._loopVariables}
    ]);
};

//find identifiers and property accessors (known in this context as MemberExpression - which can be nested), serialize them and return them as loop variables
function findLoopVariables(testNode) {
    var identifiers = _.pluck(findDeep(testNode, {type:'Identifier'}), 'name') || [],
        memberExpressions = findDeep(testNode, {type: 'MemberExpression'});

    return identifiers.concat(_.reduce(memberExpressions, function(result, memberExpression) {
        result.push(escodegen.generate(memberExpression));
        return result;
    }, []));
}

function findDeep(object, token) {
    var results = _.filter(object, token),
        childResults = _.flatten(_.map(object, function (child) {
        return typeof child == "object" ? findDeep(child, token) : [];
    }), true);

    var xx = results.concat(childResults);
    return xx;
}

module.exports = MutateIterationCommand;
