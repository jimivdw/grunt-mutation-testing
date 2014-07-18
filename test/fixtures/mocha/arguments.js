var _ = require('lodash');

function containsName(persons, name) {
  return _.contains(_.pluck(persons, 'name'), name);
}

exports.containsName = containsName;