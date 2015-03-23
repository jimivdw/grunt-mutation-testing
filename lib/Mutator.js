/*
 * Collects, locates and applies mutations
 *
 * Copyright (c) 2014 Marco Stahl
 * Licensed under the MIT license.
 */

'use strict';
var esprima = require('esprima'),
    escodegen = require('escodegen'),
    _ = require('lodash'),
    Utils = require('../utils/MutationUtils'),
    MutateBaseCommand = require('../mutationCommands/MutateBaseCommand'),
    CommandRegistry = require('../mutationCommands/CommandRegistry'),
    CommandExecutor = require('../mutationCommands/CommandExecutor');

function Mutator(src) {
    this._src = src;
    this._ast = esprima.parse(src, {range: true, loc: true, tokens: true});
    this._brackets = _.filter(esprima.tokenize(src, {range: true}), {"type": "Punctuator", "value": "("});
}

Mutator.prototype.collectMutations = function(excludeMutations) {
    var src = this._src,
        brackets = this._brackets,
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

    forEachMutation({node:this._ast, parentMutationId: _.uniqueId()}, function (mutation) {
        mutations.push(_.merge(mutation, calibrateBeginAndEnd(mutation.begin, mutation.end, brackets)));
    });

    return mutations;
};

Mutator.prototype.applyMutation = function(mutation) {
    var src = this._src;
    return src.substr(0, mutation.begin) + mutation.replacement + src.substr(mutation.end);
};

Mutator.prototype.findNodeForMutation = function(mutation) {
    var resultNode = null;

    function searchForMutation(astNode, mutation) {
        if(astNode.range && !_.difference(astNode.range, mutation.range).length) {
            return astNode;
        }
        _.forOwn(astNode, function(childNode) {
            if (childNode) {
                resultNode = resultNode || searchForMutation(childNode, mutation);
            }
        });
        return resultNode;
    }
    return searchForMutation(this._ast, mutation);
};

Mutator.prototype.serializeAST = function () {
    this._ast = escodegen.attachComments(this._ast, this._ast.comments || [], this._ast.tokens);
    return escodegen.generate(this._ast, {comment:true, format:{preserveBlankLines: true}});
};

function calibrateBeginAndEnd(begin, end, brackets) {
    //return {begin: begin, end: end};
    var beginBracket = _.find(brackets, function (bracket) {
            return bracket.range[0] === begin;
        }),
        endBracket = _.find(brackets, function (bracket) {
            return bracket.range[1] === end;
        });

    return {
        begin: beginBracket && beginBracket.value === ')' ? begin + 1 : begin,
        end: endBracket && endBracket.value === '(' ? end - 1 : end
    };
}

module.exports = Mutator;
