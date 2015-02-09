/*
 * mutations
 *
 * Copyright (c) 2014 Marco Stahl
 * Licensed under the MIT license.
 */

'use strict';
var esprima = require('esprima');
var _ = require('lodash');

function createMutation(astNode, endOffset, replacement) {
    replacement = replacement || '';
    return {
        begin: astNode.range[0],
        end: endOffset,
        line: astNode.loc.start.line,
        col: astNode.loc.start.column,
        replacement: replacement
    };
}

function createAstArrayElementDeletionMutation(astArray, element, elementIndex) {
    return createMutation(element,
        (elementIndex === astArray.length - 1) ? // is last element ?
            element.range[1] :                     // handle last element
            astArray[elementIndex + 1].range[0]    // care for commas by extending to start of next element
    );
}

function createReplaceMutationWithOtherAstNode(src, astNode, replacementAstNode) {
    return createMutation(astNode, astNode.range[1], src.substring(replacementAstNode.range[0], replacementAstNode.range[1]));
}

function mutateLiteral(astNode, fun) {
    var literalValue = astNode.value;
    var replacement;
    if (_.isString(literalValue)) {
        replacement = '"MUTATION!"';
    } else if (_.isNumber(literalValue)) {
        replacement = (literalValue + 1) + "";
    } else if (_.isBoolean(literalValue)) {
        replacement = (!literalValue) + '';
    }
    if (replacement) {
        fun(createMutation(astNode, astNode.range[1], replacement));
        return true;
    } else {
        return false;
    }
}

function findMutations(src) {
    var ast = esprima.parse(src, {range: true, loc: true});
    //console.log(JSON.stringify(ast));
    function forEachMutation(astNode, fun) {
        if (!astNode) {
            return;
        }
        var body = astNode.body;
        if (body && _.isArray(body)) {
            body.forEach(function (childNode) {
                fun(createMutation(childNode, childNode.range[1]));
                forEachMutation(childNode, fun);
            });
        }
        else if (astNode.type === 'CallExpression') {
            var args = astNode.arguments;

            args.forEach(function (arg, i) {
                if (arg.type === 'Literal' && mutateLiteral(arg, fun)) {
                    // we have found a literal mutation for this argument, so we don't need to mutate more
                    return;
                }
                fun(createMutation(arg, arg.range[1], '"MUTATION!"'));
                forEachMutation(arg, fun);
            });

            if (args.length === 1) {
                fun(createReplaceMutationWithOtherAstNode(src, astNode, args[0]));
            }

            if (astNode.callee.type === 'MemberExpression') {
                fun(createReplaceMutationWithOtherAstNode(src, astNode, astNode.callee.object));
            }

            forEachMutation(astNode.callee, fun);
        }
        else if (astNode.type === 'ObjectExpression') {
            var properties = astNode.properties;
            properties.forEach(function (property, i) {
                if (property.kind === 'init') {
                    fun(createAstArrayElementDeletionMutation(properties, property, i));
                }
                forEachMutation(property.value, fun);
            });
        }
        else if (astNode.type === 'ArrayExpression') {
            var elements = astNode.elements;
            elements.forEach(function (element, i) {
                fun(createAstArrayElementDeletionMutation(elements, element, i));
                forEachMutation(element, fun);
            });
        }
        else if (astNode.type === 'BinaryExpression') {
            var mathOperators = {
                '+': '-',
                '-': '+',
                '*': '/',
                '/': '*',
                '%': '*'
            };
            if(mathOperators.hasOwnProperty(astNode.operator)) {
                var mathOperatorMutation = {
                    begin: astNode.left.range[1],
                    end: astNode.right.range[0],
                    line: astNode.left.loc.end.line,
                    col: astNode.left.loc.end.column,
                    replacement:  mathOperators[astNode.operator]
                };

                fun(mathOperatorMutation);
            }
        }
        else if (astNode.type === 'Literal') {
            mutateLiteral(astNode, fun);
        }
        else if (_.isObject(astNode)) {
            _.forOwn(astNode, function (child) {
                forEachMutation(child, fun);
            });
        }
    }

    var mutations = [];
    forEachMutation(ast, function (mutation) {
        mutations.push(mutation);
    });

    return mutations;
}

function applyMutation(src, mutation) {
    return src.substr(0, mutation.begin) + mutation.replacement + src.substr(mutation.end);
}

exports.findMutations = findMutations;
exports.applyMutation = applyMutation;
