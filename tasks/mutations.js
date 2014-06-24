/*
 * mutations
 *
 * Copyright (c) 2014 Marco Stahl
 * Licensed under the MIT license.
 */

'use strict';
var esprima = require('esprima');
var _ = require('lodash');

function findMutations(src) {
  var ast = esprima.parse(src, {range: true, loc: true});

  function forEachMutation(astNode, fun) {
    if (!astNode) {
      return;
    }
    var body = astNode.body;
    if (body && _.isArray(body)) {
      body.forEach(function (childNode) {
        var mutation = {
          begin: childNode.range[0],
          end: childNode.range[1],
          line: childNode.loc.start.line,
          col: childNode.loc.start.column
        };
        fun(mutation);
        forEachMutation(childNode, fun);
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
  return src.substr(0, mutation.begin) + src.substr(mutation.end);
}

exports.findMutations = findMutations;
exports.applyMutation = applyMutation;
