/**
 * Created by Martin Koster on 3/3/15.
 */
var HandleBars = require("handlebars"),
    IOUtils = require('../../../utils/IOUtils'),
    path = require('path'),
    fs = require('fs'),
    _ = require('lodash');

var IndexHtmlBuilder = function(baseDir, successThreshold){
    this._baseDir = baseDir;
    this._successThreshold = successThreshold || 80;
    this._folderPercentages = {};
};
var segmentLinkTemplate = HandleBars.compile('<span class="link {{status}}" onclick="location.href=\'{{segment}}/index.html\'">{{folder}}</span>/');
var fileLinkTemplate = HandleBars.compile('<span class="link {{status}}" onclick="location.href=\'{{path}}\'">{{file}}</span>/');

IndexHtmlBuilder.prototype.createIndexFile = function(currentDir, files){
    var allStats = _.reduce(files, accumulateStatsAndPercentages, {}, this),
        folderSuccessRate = (allStats.all - allStats.survived) / allStats.all * 100,
        indexSource = fs.readFileSync(__dirname + '/templates/index.html', 'utf-8'),
        indexTemplate = HandleBars.compile(indexSource),
        listItems = '';

    _.forEach(files, function(file){
        listItems = listItems.concat('<li>', linkPathItems (
            path.relative(this._baseDir, currentDir),
            file,
            this._folderPercentages,
            this._successThreshold
        ), '</li>\n');
    }, this);

    fs.writeFileSync(currentDir+"/index.html", indexTemplate({
        listItems:listItems,
        stats: allStats,
        style: fs.readFileSync(__dirname + '/templates/index.css', 'utf-8'),
        status: folderSuccessRate > this._successThreshold ? 'killed' : 'survived',
        folderSuccessRate: folderSuccessRate.toFixed(1)
    }));
};
module.exports = IndexHtmlBuilder;


function linkPathItems(baseDir, file, folderPercentages, successThreshold) {
    var relativeLocation = path.relative(baseDir, file.fileName),
        directoryList = IOUtils.getDirectoryList(relativeLocation, true),
        rawPath = '.',
        linkedPath = '',
        filePerc = (file.stats.all - file.stats.survived) / file.stats.all * 100,
        fileStatus = filePerc > successThreshold ? 'killed' : 'survived',
        folderStatus;

    _.forEach(directoryList, function(folder) {
        var perc = folderPercentages[folder];
        rawPath=  rawPath.concat('/', folder);
        folderStatus = perc.total /  perc.weight > successThreshold ? 'killed' : 'survived';
        linkedPath = linkedPath.concat(segmentLinkTemplate({segment: rawPath, folder: folder, status: folderStatus}));
    });

    return linkedPath.concat(fileLinkTemplate({path: relativeLocation, file: path.relative(rawPath, relativeLocation), status : fileStatus}));
}

function accumulateStatsAndPercentages(result, file) {
    var folders = IOUtils.getDirectoryList(file.fileName, true);

    _.forEach(folders, function(folder){
        this._folderPercentages[folder] = this._folderPercentages[folder] || {};
        this._folderPercentages[folder].total = (this._folderPercentages[folder].total || 0) + (file.stats.all - file.stats.survived) / file.stats.all * 100;
        this._folderPercentages[folder].weight = (this._folderPercentages[folder].weight || 0) + 1
    }, this);

    result.ignored = (result.ignored || 0) + file.stats.ignored;
    result.all = (result.all || 0) + file.stats.all;
    result.untested = (result.untested || 0) + file.stats.untested;
    result.survived = (result.survived || 0) + file.stats.survived;
    return result;
}
