/**
 * Created by Merlin Weemaes on 3/2/15.
 */
var HandleBars = require("handlebars");
var fs = require("fs");
var Promise = require('q');
var pathRegex = /([^\\\/]+)/g;

//TODO: make non-blocking
function getDirectoryList(path, excludeLastSegment) {
    var currentSegment,
        segment = pathRegex.exec(path),
        directoryList = [];

    console.log(segment);
    while (segment) {
        currentSegment = segment[0];
        segment = pathRegex.exec(path);
        if (!excludeLastSegment || segment) {
            directoryList.push(currentSegment);
        }
    }

    console.log(directoryList);
    return directoryList;
}

function createDirectoryTree(results){
    var directoryList,
        directoryTree = {},
        directoryNode;

    results.forEach(function(result){
        directoryNode = directoryTree;
        directoryList = getDirectoryList(result.fileName);

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

function createDirIfNotExists(newDir) {
    try {
        fs.statSync(newDir);
    } catch (e) {
        fs.mkdirSync(newDir);
    }
}

function createHtml(directoryTree, baseDir){
    var keys = Object.keys(directoryTree);

    keys.forEach(function(key) {
            console.log('processing key: ', key);
            console.log('processing dir: ', directoryTree[key]);
            if (key !== "files") {
                console.log('creating dir and index in '+baseDir);
                var newDir = baseDir + "/" + key;
                createDirIfNotExists(newDir);
                createHtml(directoryTree[key], newDir);
            }else{
                createFileReports(directoryTree[key], baseDir);
            }
            createIndexFile(directoryTree[key], baseDir);

        }
    );
}

function createIndexFile(directoryTree, baseDir){
    fs.writeFileSync(baseDir+"/index.html", baseDir + " test");
}

function createFileReports(fileResults, baseDir){
    fileResults.forEach(function (fileResult){
       fs.writeFileSync(baseDir+"/"+fileResult.fileName+".html", "file test");
    });
}

var HtmlReporter = function(path) {
    var directories, parentDir = './';
    this._path = path;
    directories = getDirectoryList(path, false);
    directories.forEach(function(directory){
        parentDir += '/' + directory;
        createDirIfNotExists(parentDir);
    });
};

HtmlReporter.prototype.create = function(results) {
    var fileSource = fs.readFileSync(__dirname + '/templates/file.html', 'utf-8'),
        indexSource = fs.readFileSync(__dirname + '/templates/index.html', 'utf-8'),
        fileTemplate = HandleBars.compile(fileSource),
        indexTemplate = HandleBars.compile(indexSource),
        fileResults,
        html = fileTemplate(fileResults),
        directoryTree = createDirectoryTree(results),
        allDirectories, subPath;

    //console.log(JSON.stringify(directoryTree));
    createHtml(directoryTree, this._path);
};

module.exports = HtmlReporter;
