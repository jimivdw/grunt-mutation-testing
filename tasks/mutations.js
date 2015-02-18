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
    CommandExecutor = require('../mutationCommands/CommandExecutor');

function findMutations(src) {
    var ast = esprima.parse(src, {range: true, loc: true}),
        mutations = [];

    function forEachMutation(astNode, processMutation, parentMutationId) {
        var body = astNode && astNode.body,
            /* while selecting a command requires the node, the actual prcessing may
             * in some cases require the body of the node, which is itself a node */
            nodeToProcess = (body && _.isArray(body)) ? body : astNode,
            Command;

        Command = astNode && CommandExecutor.selectCommand(astNode);
        if (Command) {
            _.forEach(CommandExecutor.executeCommand(new Command(src, nodeToProcess, processMutation, parentMutationId)),
                function (subTree) {
                    if (subTree.hasOwnProperty('node') && subTree.hasOwnProperty('parentMutationId')) {
                        forEachMutation(subTree.node, processMutation, subTree.parentMutationId);
                    }
                });
        }
    }

    forEachMutation(ast, function (mutation) {
        mutations.push(mutation);
    }, _.uniqueId());

    return mutations;
}

function applyMutation(src, mutation) {
    return src.substr(0, mutation.begin) + mutation.replacement + src.substr(mutation.end);
}

module.exports.findMutations = findMutations;
module.exports.applyMutation = applyMutation;
