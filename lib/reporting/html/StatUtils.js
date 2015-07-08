/**
 * StatUtils
 *
 * @author Jimi van der Woning
 */
'use strict';

var _ = require('lodash');

function decorateStatPercentages(stats) {
    var decoratedStats = _.clone(stats);
    decoratedStats.success = stats.all - stats.survived;
    decoratedStats.successRate = (decoratedStats.success / stats.all * 100 || 0).toFixed(1);
    decoratedStats.killedRate = (stats.killed / stats.all * 100 || 0).toFixed(1);
    decoratedStats.survivedRate = (stats.survived / stats.all * 100 || 0).toFixed(1);
    decoratedStats.ignoredRate = (stats.ignored / stats.all * 100 || 0).toFixed(1);
    decoratedStats.untestedRate = (stats.untested / stats.all * 100 || 0).toFixed(1);
    return decoratedStats;
}

module.exports.decorateStatPercentages = decorateStatPercentages;
