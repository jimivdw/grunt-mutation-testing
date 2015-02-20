/*
 * mutations
 *
 * Copyright (c) 2014 Marco Stahl
 * Licensed under the MIT license.
 */

'use strict';
var esprima = require('esprima'),
    _ = require('lodash'),
    Utils = require('../utils/MutationUtils'),
    CommandExecutor = require('../mutationCommands/CommandExecutor'),
    MutateComparisonOperatorCommand = require('../mutationCommands/MutateComparisonOperatorCommand'),
    MutateArithmeticOperatorCommand = require('../mutationCommands/MutateArithmeticOperatorCommand'),
    MutateArrayExpressionCommand = require('../mutationCommands/MutateArrayExpressionCommand'),
    MutateArrayCommand = require('../mutationCommands/MutateArrayCommand'),
    MutateObjectCommand = require('../mutationCommands/MutateObjectCommand'),
    MutateLiteralCommand = require('../mutationCommands/MutateLiteralCommand'),
    MutateDefaultCommand = require('../mutationCommands/MutateBaseCommand'),
    MutateCallExpressionCommand = require('../mutationCommands/MutateCallExpressionCommand'),
    MutateDecrementIncrementOperatorCommand = require('../mutationCommands/MutateDecrementIncrementOperatorCommand');

//TODO: move this to the CommandRegistry when that is merged into this branch
function getDefaultExcludes() {
    var excludes = {};
    excludes[MutateComparisonOperatorCommand.code] = MutateComparisonOperatorCommand.exclude;
    excludes[MutateArithmeticOperatorCommand.code] = MutateArithmeticOperatorCommand.exclude;
    excludes[MutateArrayExpressionCommand.code] = MutateArrayExpressionCommand.exclude;
    excludes[MutateArrayCommand.code] = MutateArrayCommand.exclude;
    excludes[MutateObjectCommand.code] = MutateObjectCommand.exclude;
    excludes[MutateLiteralCommand.code] = MutateLiteralCommand.exclude;
    excludes[MutateCallExpressionCommand.code] = MutateCallExpressionCommand.exclude;
    excludes[MutateDecrementIncrementOperatorCommand.code] = MutateDecrementIncrementOperatorCommand.exclude;
    return excludes;
}
function findMutations(src, excludeMutations) {
    var ast = esprima.parse(src, {range: true, loc: true}),
        excludes = _.merge(getDefaultExcludes(), excludeMutations);
    //console.log(JSON.stringify(ast));
    function forEachMutation(astNode, processMutation, parentMutationId) {
        if (!astNode) {
            return;
        }
        var _astNode = astNode,
            body = astNode.body,
            Command;

        if (body && _.isArray(body)) {
            _astNode = body;
            Command = MutateArrayCommand;
        }
        else if (astNode.type === 'CallExpression') {
            Command = MutateCallExpressionCommand;
        }
        else if (astNode.type === 'ObjectExpression') {
            Command = MutateObjectCommand;
        }
        else if (astNode.type === 'ArrayExpression') {
            Command = MutateArrayExpressionCommand;
        }
        else if (astNode.type === 'BinaryExpression') {
            // TODO: these mutations can theoretically introduce endless loops
            Command = _.indexOf(['+', '-', '*', '/', '%'], astNode.operator) > -1 ?
                MutateArithmeticOperatorCommand : MutateComparisonOperatorCommand;
        }
        else if (astNode.type === 'UpdateExpression') {
            Command = MutateDecrementIncrementOperatorCommand;
        }
        else if (astNode.type === 'Literal') {
            Command = MutateLiteralCommand;
        }
        else if (_.isObject(astNode)) {
            Command = MutateDefaultCommand;
        }

        if (Command) {
            if (excludes[Command.code]) { //the command code is not included - revert to default command
                Command = MutateDefaultCommand;
            }
            _.forEach(CommandExecutor.executeCommand(new Command(src, _astNode, processMutation, parentMutationId)),
                function (astChildNode) {
                    if (astChildNode.hasOwnProperty('node') && astChildNode.hasOwnProperty('parentMutationId')) {
                        forEachMutation(astChildNode.node, processMutation, astChildNode.parentMutationId);
                    }
                });
        }
    }

    var mutations = [];
    forEachMutation(ast, function (mutation) {
        mutations.push(mutation);
    }, _.uniqueId());

    return mutations;
}

function applyMutation(src, mutation) {
    return src.substr(0, mutation.begin) + mutation.replacement + src.substr(mutation.end);
}

exports.findMutations = findMutations;
exports.applyMutation = applyMutation;
