/**
 * The command executor contains a registry of the possible mutation commands and the predicates for which they a command will be selected.
 * It will select and return a command based on the given syntax tree node and execute any commands passed to it.
 *
 * To add new commands to the application simply create a new Mutation command based on MutationBaseCommand and add it to the registry together with an appropriate predicate.
 * Created by Martin Koster on 2/11/15.
 */

var _ = require('lodash'),
    MutateComparisonOperatorCommand = require('../mutationCommands/MutateComparisonOperatorCommand'),
    MutateArithmeticOperatorCommand = require('../mutationCommands/MutateArithmeticOperatorCommand'),
    MutateArrayExpressionCommand = require('../mutationCommands/MutateArrayExpressionCommand'),
    MutateArrayCommand = require('../mutationCommands/MutateArrayCommand'),
    MutateObjectCommand = require('../mutationCommands/MutateObjectCommand'),
    MutateLiteralCommand = require('../mutationCommands/MutateLiteralCommand'),
    MutateBaseCommand = require('../mutationCommands/MutateBaseCommand'),
    MutateCallExpressionCommand = require('../mutationCommands/MutateCallExpressionCommand'),
    MutateDecrementIncrementOperatorCommand = require('../mutationCommands/MutateDecrementIncrementOperatorCommand');

function isArithmeticExpression(node) {
    return _.indexOf(['+', '-', '*', '/', '%'], node.operator) > -1;
}

var commandRegistry  = [
    {predicate: function(node) {return node.body && _.isArray(node.body);}, Command: MutateArrayCommand},
    {predicate: function(node) {return node && node.type === 'CallExpression';}, Command: MutateCallExpressionCommand},
    {predicate: function(node) {return node && node.type === 'ObjectExpression';}, Command: MutateObjectCommand},
    {predicate: function(node) {return node && node.type === 'ArrayExpression';}, Command: MutateArrayExpressionCommand},
    {predicate: function(node) {return node && node.type === 'BinaryExpression' && isArithmeticExpression(node);}, Command: MutateArithmeticOperatorCommand},
    {predicate: function(node) {return node && node.type === 'BinaryExpression' && !isArithmeticExpression(node);}, Command: MutateComparisonOperatorCommand},
    {predicate: function(node) {return node && node.type === 'UpdateExpression';}, Command: MutateDecrementIncrementOperatorCommand},
    {predicate: function(node) {return node && node.type === 'Literal';}, Command: MutateLiteralCommand},
    {predicate: function(node) {return _.isObject(node);}, Command: MutateBaseCommand}
];
(function (exports) {

    /**
     * executes a given command
     * @param {object} mutationCommand an instance of a mutation command
     * @returns {array} sub-nodes to be processed
     */
    function executeCommand(mutationCommand) {
        return mutationCommand.execute();
    }

    /**
     * Selectes a command based on the given Abstract Syntax Tree node.
     * @param {object} node the node for which to return a mutation command
     * @returns {object} The command to be executed for this node
     */
    function selectCommand(node) {
        var commandRegistryItem = _.find(commandRegistry, function(registryItem) {
            return !!registryItem.predicate(node);
        });
        return commandRegistryItem ? commandRegistryItem.Command : null;
    }

    exports.selectCommand = selectCommand;
    exports.executeCommand = executeCommand;
})(module.exports);
