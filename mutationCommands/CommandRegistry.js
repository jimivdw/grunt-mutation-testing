/**
 * This registry contains all the possible mutation commands and the predicates for which they a command will be selected.
 * It will select and return a command based on the given syntax tree node.
 *
 * To add new commands to the application simply create a new Mutation command based on MutationBaseCommand and add it to the registry together with an appropriate predicate.
 *
 * Created by Martin Koster on 2/20/15.
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
    MutateDecrementIncrementOperatorCommand = require('../mutationCommands/MutateDecrementIncrementOperatorCommand'),
    registry  = [
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

function isArithmeticExpression(node) {
    return _.indexOf(['+', '-', '*', '/', '%'], node.operator) > -1;
}
(function CommandRegistry(exports) {

    /**
     * Selectes a command based on the given Abstract Syntax Tree node.
     * @param {object} node the node for which to return a mutation command
     * @returns {object} The command to be executed for this node
     */
    function selectCommand(node) {
        var commandRegistryItem = _.find(registry, function(registryItem) {
            return !!registryItem.predicate(node);
        });
        return commandRegistryItem ? commandRegistryItem.Command : null;
    }

    /**
     * returns the default exclusion status of each mutation command
     * @returns {object} a list of mutation codes [key] and whether or not they're excluded [value]
     */
    function getDefaultExcludes() {
        var excludes = {};
        _.forEach(_.pluck(registry, 'Command'), function(Command){
            excludes[Command.code] = !!Command.exclude;
        });
        return excludes;
    }

    exports.selectCommand = selectCommand;
    exports.getDefaultExcludes = getDefaultExcludes;
})(module.exports);
