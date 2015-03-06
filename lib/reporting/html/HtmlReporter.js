/**
 * Created by Merlin Weemaes on 3/2/15.
 */
var FileHtmlBuilder = require("./FileHtmlBuilder"),
    IndexHtmlBuilder = require("./IndexHtmlBuilder"),
    IOUtils = require("../../../utils/IOUtils"),
    fs = require("fs"),
    Q = require('q'),
    _ = require('lodash');

var HtmlReporter = function(path) {
    this._path = path;
    createBasePath(path);
};

/**
 * creates an HTML report using the given results
 * @param results
 * @returns {*}
 */
HtmlReporter.prototype.create = function(results) {
    var path = this._path;
    return Q.Promise(function (resolve) {
        var directoryTree = createDirectoryTree(results);
        new IndexHtmlBuilder(path).createIndexFile(createHtml(directoryTree, path));
        resolve();
    });
};

module.exports = HtmlReporter;

//private functions
/*
 * creates the base path for the report
 */
function createBasePath(path) {
    var directories = IOUtils.getDirectoryList(path, false),
        parentDir = './';

    _.forEach(directories, function (directory) {
        parentDir += '/' + directory;
        IOUtils.createDirIfNotExists(parentDir);
    });
}

/*
 * creates a directory tree from the paths found in the results
 */
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
                directoryNode[directoryList[i]].files.push(result);
            }
            directoryNode = directoryNode[directoryList[i]];
        }
    });
    return directoryTree;
}

/*
 * recursively steps through the tree creating the relevant html: index.html for each directory and <filename>.html for each file found
 */
function createHtml(directoryTree, baseDir, currentDir) {
    var keys = Object.keys(directoryTree),
        files = [];

    currentDir = currentDir || baseDir;
    _.forEach(keys, function (key) {
        if (key !== "files") {
            var newDir = currentDir + "/" + key;
            IOUtils.createDirIfNotExists(newDir);
            _.union(files, createHtml(directoryTree[key], baseDir, newDir));
        } else {
            new FileHtmlBuilder().createFileReports(directoryTree.files, baseDir);
            new IndexHtmlBuilder(currentDir).createIndexFile(files);
            files.push({path: currentDir, files: files});
        }
    });
    return files;
}
