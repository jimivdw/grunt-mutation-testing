/**
 * Created by Martin Koster on 2/18/15.
 */
var _ = require('lodash');
module.exports.determineReplacement = function (literalValue) {
    var replacement;

    if (_.isString(literalValue)) {
        replacement = '"MUTATION!"';
    } else if (_.isNumber(literalValue)) {
        replacement = (literalValue + 1) + "";
    } else if (_.isBoolean(literalValue)) {
        replacement = (!literalValue) + '';
    }
    return replacement;
};
