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
    MutateBaseCommand = require('../mutationCommands/MutateBaseCommand'),
    CommandRegistry = require('../mutationCommands/CommandRegistry'),
    CommandExecutor = require('../mutationCommands/CommandExecutor');

function findMutations(src, excludeMutations) {
    var ast = esprima.parse(src, {range: true, loc: true}),
        excludes = _.merge(CommandRegistry.getDefaultExcludes(), excludeMutations),
        mutations = [];

    function forEachMutation(subtree, processMutation) {
        var astNode = subtree.node,
            Command;

        Command = astNode && CommandRegistry.selectCommand(astNode);
        if (Command) {
            if (excludes[Command.code]) { //the command code is not included - revert to default command
                Command = MutateBaseCommand;
            }
            _.forEach(CommandExecutor.executeCommand(new Command(src, subtree, processMutation)),
                function (subTree) {
                    forEachMutation(subTree, processMutation);
                }
            );
        }
    }

    forEachMutation({node:ast, parentMutationId: _.uniqueId()}, function (mutation) {
        mutations.push(mutation);
    });

    return mutations;
}

function applyMutation(src, mutation) {
    return src.substr(0, mutation.begin) + mutation.replacement + src.substr(mutation.end);
}

module.exports.findMutations = findMutations;
module.exports.applyMutation = applyMutation;
