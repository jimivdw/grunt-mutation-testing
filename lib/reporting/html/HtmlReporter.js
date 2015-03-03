/**
 * Created by Merlin Weemaes on 3/2/15.
 */
var FileHtmlBuilder = require("./FileHtmlBuilder"),
    IndexHtmlBuilder = require("./IndexHtmlBuilder"),
    IOUtils = require("../../../utils/IOUtils"),
    fs = require("fs"),
    Promise = require('q'),
    _ = require('lodash');

var HtmlReporter = function(path) {
    this._path = path;
    createBaseDirectory(path);
};

HtmlReporter.prototype.create = function(results) {
    var directoryTree = createDirectoryTree(results);
    createHtml(directoryTree, this._path);
};

module.exports = HtmlReporter;

//private functions
function createBaseDirectory(path) {
    var directories = IOUtils.getDirectoryList(path, false),
        parentDir = './';

    _.forEach(directories, function (directory) {
        parentDir += '/' + directory;
        IOUtils.createDirIfNotExists(parentDir);
    });
}

function createDirectoryTree(results){
    var directoryList,
        directoryTree = {},
        directoryNode;

    _.forEach(results, function(result){
        directoryNode = directoryTree;
        directoryList = IOUtils.getDirectoryList(result.fileName);

        for(var i=0; i < directoryList.length - 1; i++){
            if (!directoryNode.hasOwnProperty(directoryList[i])) {
                directoryNode[directoryList[i]] = {files:[]};
            }
            if (i == directoryList.length - 2) {
                directoryNode[directoryList[i]].files.push({ "fileName":directoryList[i+1], "result" : result});
            }
            directoryNode = directoryNode[directoryList[i]];
        }
    });
    return directoryTree;
}

function createHtml(directoryTree, baseDir) {
    var keys = Object.keys(directoryTree);

    _.forEach(keys, function (key) {
        if (key !== "files") {
            var newDir = baseDir + "/" + key;
            IOUtils.createDirIfNotExists(newDir);
            createHtml(directoryTree[key], newDir);
        } else {
            new FileHtmlBuilder().createFileReports(directoryTree.files, baseDir);
        }
        new IndexHtmlBuilder(baseDir).createIndexFile(directoryTree[key]);
    });
}
