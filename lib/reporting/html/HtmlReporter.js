/**
 * Created by Merlin Weemaes on 3/2/15.
 */
var HandleBars = require("handlebars"),
    FileHtmlBuilder = require("./FileHtmlBuilder"),
    IOUtils = require("../../../utils/IOUtils"),
    fs = require("fs"),
    Promise = require('q'),
    _ = require('lodash');

var HtmlReporter = function(path, source) {
    var directories, parentDir = './';
    this._path = path;
    this._source = source;
    directories = IOUtils.getDirectoryList(path, false);
    _.forEach(directories, function(directory){
        parentDir += '/' + directory;
        IOUtils.createDirIfNotExists(parentDir);
    });
};

HtmlReporter.prototype.create = function(results) {
    var directoryTree = createDirectoryTree(results);

    //console.log(JSON.stringify(directoryTree).replace(/},/g, '},\n\t'));
    createHtml.call(this, directoryTree, this._path);
};

module.exports = HtmlReporter;

//private functions

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

function createHtml(directoryTree, baseDir){
    var keys = Object.keys(directoryTree);

    console.log('keys', keys);
    _.forEach(keys, function(key) {
            console.log('processing key: ', key);
            console.log('processing dir: ', directoryTree[key]);
            if (key !== "files") {
                console.log('creating dir and index in '+baseDir);
                var newDir = baseDir + "/" + key;
                IOUtils.createDirIfNotExists(newDir);
                createHtml.call(this, directoryTree[key], newDir);
            } else {
                new FileHtmlBuilder(this._source).createFileReports(directoryTree.files, baseDir);
            }
            createIndexFile(directoryTree[key], baseDir);
        }, this);
}




function createIndexFile(directoryTree, baseDir){
    var indexSource = fs.readFileSync(__dirname + '/templates/index.html', 'utf-8'),
        indexTemplate = HandleBars.compile(indexSource);

    fs.writeFileSync(baseDir+"/index.html", baseDir + " test");
}
