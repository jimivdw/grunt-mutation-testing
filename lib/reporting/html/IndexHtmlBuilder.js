/**
 * HTML reporter
 *
 * @author Martin Koster
 * @author Jimi van der Woning
 */
'use strict';

var _ = require('lodash'),
    fs = require('fs'),
    path = require('path');

var IOUtils = require('../../../utils/IOUtils'),
    StatUtils = require('./StatUtils'),
    Templates = require('./Templates');

var DEFAULT_CONFIG = {
    successThreshold: 80
};

/**
 * IndexHtmlBuilder constructor.
 *
 * @param {string} baseDir
 * @param {object=} config
 * @constructor
 */
var IndexHtmlBuilder = function(baseDir, config) {
    this._baseDir = baseDir;
    this._config = _.merge({}, DEFAULT_CONFIG, config);
    this._folderPercentages = {};
};

IndexHtmlBuilder.prototype._getBreadcrumb = function(toDir) {
    var self = this,
        breadcrumb = '',
        relativePath = path.join(path.basename(self._baseDir), path.relative(self._baseDir, toDir)),
        segments = relativePath.split(path.sep),
        currentSegment = '';

    _.forEach(segments, function(folder, i) {
        currentSegment = path.join(currentSegment, folder);
        breadcrumb = breadcrumb.concat(Templates.segmentLinkTemplate({
            segment: path.relative(relativePath, currentSegment) || '.',
            folder: folder,
            separator: i < segments.length - 1 ? '&nbsp;>>&nbsp;' : ''
        }));
    });

    return breadcrumb;
};

/**
 * create the index file for the current directory. The index file contains a list of all mutated files in all
 * subdirectories, including links for drilling down into the subdirectories
 * @param currentDir the directory for which to create the index file
 * @param files mutated files within the directory subtree of currentDir
 */
IndexHtmlBuilder.prototype.createIndexFile = function(currentDir, files) {
    var allStats = StatUtils.decorateStatPercentages(_.reduce(files, this._accumulateStatsAndPercentages, {}, this)),
        index,
        rows = '';

    _.forEach(files, function(file) {
        var relativePath = path.relative(this._baseDir, currentDir),
            fileStats = StatUtils.decorateStatPercentages(file.stats),
            pathSegments = this.linkPathItems({
                currentDir: relativePath,
                fileName: file.fileName,
                separator: ' / '
            });

        rows = rows.concat(Templates.folderFileRowTemplate({
            pathSegments: pathSegments,
            stats: fileStats,
            status: fileStats.successRate > this._config.successThreshold ? 'killed' : fileStats.successRate > 0 ? 'survived' : 'neutral'
        }));
    }, this);

    index = Templates.folderTemplate({
        rows: rows
    });

    fs.writeFileSync(
        currentDir + "/index.html",
        Templates.baseTemplate({
            style: Templates.baseStyleTemplate({ additionalStyle: Templates.folderStyleCode }),
            fileName: path.basename(path.relative(this._baseDir, currentDir)),
            stats: allStats,
            status: allStats.successRate > this._config.successThreshold ? 'killed' : 'survived',
            breadcrumb: this._getBreadcrumb(currentDir),
            generatedAt: new Date().toLocaleString(),
            content: index
        })
    );
};

/**
 * Adds Hyperlinks to each path segment - linking to the relevant directory's index.html
 * @param {{currentDir, fileName, separator, [filePerc], [relativePath]}} options object containing the parameters to link the path items
 * @returns {string}
 */
IndexHtmlBuilder.prototype.linkPathItems = function(options) {
    var folderPercentages = this._folderPercentages || {},
        successThreshold = this._config.successThreshold,
        fileName = path.basename(options.fileName, '.html'),
        relativeLocation = IOUtils.normalizeWindowsPath(path.relative(options.currentDir, options.fileName)),
        rawPath = options.relativePath || '.',
        directoryList = IOUtils.getDirectoryList(relativeLocation.replace(rawPath, ''), true),
        linkedPath = '',
        fileStatus = options.filePerc ? options.filePerc > successThreshold ? 'killed' : 'survived' : '',
        folderStatus;

    _.forEach(directoryList, function(folder) {
        var perc = options.filePerc && folderPercentages ? folderPercentages[folder] : null;
        rawPath = rawPath.concat('/', folder);
        folderStatus = perc ? perc.total / perc.weight > successThreshold ? 'killed' : 'survived' : '';
        linkedPath = linkedPath.concat(Templates.segmentLinkTemplate({
            segment: rawPath,
            folder: folder,
            status: folderStatus,
            separator: options.separator
        }));
    });

    if (options.linkDirectoryOnly) {
        return linkedPath.concat(fileName);
    }else {
        return linkedPath.concat(Templates.fileLinkTemplate({
            path: relativeLocation,
            separator: options.separator,
            file: fileName,
            status: fileStatus
        }));
    }
};

/**
 * accumulates the statistics of given file in each of its path segments and returns the mutation statistics for that file
 * @param result result containing stats
 * @param file file for which to collect stats
 * @returns {{all, ignored, untested, survived}} stats for the given file
 */
IndexHtmlBuilder.prototype._accumulateStatsAndPercentages = function(result, file) {
    var folders = IOUtils.getDirectoryList(file.fileName, true);
    _.forEach(folders, function(folder) {
        this._folderPercentages[folder] = this._folderPercentages[folder] || {};
        this._folderPercentages[folder].total = (this._folderPercentages[folder].total || 0) +
        (file.stats.all - file.stats.survived) / file.stats.all * 100;
        this._folderPercentages[folder].weight = (this._folderPercentages[folder].weight || 0) + 1;
    }, this);

    result.all = (result.all || 0) + file.stats.all;
    result.killed = (result.killed || 0) + file.stats.killed;
    result.survived = (result.survived || 0) + file.stats.survived;
    result.ignored = (result.ignored || 0) + file.stats.ignored;
    result.untested = (result.untested || 0) + file.stats.untested;
    return result;
};

module.exports = IndexHtmlBuilder;
