/**
 * Created by Martin Koster on 3/3/15.
 */
var HandleBars = require("handlebars"),
    IOUtils = require('../../../utils/IOUtils'),
    path = require('path'),
    fs = require('fs'),
    _ = require('lodash');

var IndexHtmlBuilder = function(baseDir){
    this._baseDir = baseDir;
};

var segmentLinkTemplate = HandleBars.compile('<a href="{{segment}}/index.html">{{folder}}</a>/');
var fileLinkTemplate = HandleBars.compile('<a href="{{path}}">{{file}}</a>/');
IndexHtmlBuilder.prototype.createIndexFile = function(currentDir, files){
    var indexSource = fs.readFileSync(__dirname + '/templates/index.html', 'utf-8'),
        indexTemplate = HandleBars.compile(indexSource),
        listItems = '';

    _.forEach(files, function(file){
        listItems = listItems.concat('<li>', linkPathItems(path.relative(this._baseDir, currentDir), file.fileName), '</li>\n');
    }, this);

    fs.writeFileSync(currentDir+"/index.html", indexTemplate({listItems:listItems}));
};

function linkPathItems(baseDir, file) {
    var relativelocation = path.relative(baseDir, file),
        directoryList = IOUtils.getDirectoryList(relativelocation, true),
        rawPath = './',
        linkedPath = '';

    _.forEach(directoryList, function(folder) {
        rawPath=  rawPath.concat('/', folder);
        linkedPath = linkedPath.concat(segmentLinkTemplate({segment: rawPath, folder: folder}));
    });

    return linkedPath.concat(fileLinkTemplate({path: relativelocation, file: path.relative(rawPath, relativelocation)}));
}

module.exports = IndexHtmlBuilder;
