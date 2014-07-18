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

function findMutations(src) {
  var ast = esprima.parse(src, {range: true, loc: true});
  //  console.log(JSON.stringify(ast));
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
    } else if (astNode.type === 'CallExpression') {
      var args = astNode.arguments;
      args.forEach(function (arg, i) {
        fun(createMutation(arg, arg.range[1], '"MUTATION!"'));
        forEachMutation(arg, fun);
      });
      forEachMutation(astNode.callee, fun);
    } else if (astNode.type === 'ObjectExpression') {
      var properties = astNode.properties;
      properties.forEach(function (property, i) {
        if (property.kind === 'init') {
          fun(createMutation(property,
            (i === properties.length - 1) ? // is last property ?
              property.range[1] :           // handle last property
              properties[i + 1].range[0]    // care for commas by extending to start of next property
          ));
        }
        forEachMutation(property.value, fun);
      });
    } else if (_.isObject(astNode)) {
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
