/**
 * Created by Merlin Weemaes on 3/2/15.
 */
var FileHtmlBuilder = require("./FileHtmlBuilder"),
    IndexHtmlBuilder = require("./IndexHtmlBuilder"),
    IOUtils = require("../../../utils/IOUtils"),
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
        var directoryTree = rebuildDirectoryTree(results, path);
        new IndexHtmlBuilder(path).createIndexFile(createHtml(directoryTree, path));
        resolve();
    });
};

module.exports = HtmlReporter;

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
function rebuildDirectoryTree(results, path){
    var directoryList,
        directoryNode,
        directoryTree = {files:[]},
        currentDirectory,
        processResults = function(earlierResults) {
            directoryNode.files = _.union(directoryNode.files, earlierResults);
            IOUtils.writeFileInPromise( path + '/' + directoryList.join('/') + '/results.json', JSON.stringify(directoryNode.files)).done();
        };

    _.forEach(results, function(result){
        directoryNode = directoryTree;
        directoryList = IOUtils.getDirectoryList(result.fileName, true);

        for(var i=0; i < directoryList.length; i++){
            currentDirectory = directoryList[i];
            directoryNode[currentDirectory] = directoryNode[currentDirectory] || {files:[]};
            directoryNode = directoryNode[currentDirectory];
        }

        directoryNode.files.push(result);
        IOUtils.readFileInPromise(path + '/' + directoryList.join('/') + '/results.json')
            .then(function(data){processResults(data);}, function() {processResults({});})
            .done();

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
    new FileHtmlBuilder().createFileReports(directoryTree.files, baseDir);
    files = _.union(files, directoryTree.files);
    _.forEach(keys, function (key) {
        if (key !== "files") {
            var newDir = currentDir + "/" + key;
            IOUtils.createDirIfNotExists(newDir);
            files = _.union(files, createHtml(directoryTree[key], baseDir, newDir));
            new IndexHtmlBuilder(currentDir).createIndexFile(files);
        }
    });

    return files;
}
