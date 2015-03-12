/**
 * Created by Merlin Weemaes on 3/2/15.
 */
var FileHtmlBuilder = require("./FileHtmlBuilder"),
    IndexHtmlBuilder = require("./IndexHtmlBuilder"),
    IOUtils = require("../../../utils/IOUtils"),
    fs = require('fs'),
    path = require('path'),
    Q = require('q'),
    _ = require('lodash');

var HtmlReporter = function(basePath) {
    var directories = IOUtils.getDirectoryList(basePath, false);

    IOUtils.createPathIfNotExists(directories, './');
    this._path = basePath;
};

/**
 * creates an HTML report using the given results
 * @param results
 * @returns {*}
 */
HtmlReporter.prototype.create = function(results) {
    var rootPath = this._path;
    return Q.Promise(function (resolve) {
        _.forEach(results, function(result){
            IOUtils.createPathIfNotExists(IOUtils.getDirectoryList(result.fileName, true), rootPath);
        }, this);
        new FileHtmlBuilder().createFileReports(results, rootPath);
        createDirectoryIndexes(results, rootPath);
        resolve();
    });
};

module.exports = HtmlReporter;

function createDirectoryIndexes(results, baseDir, currentDir) {
    var dirContents,
        files = [];

    currentDir = currentDir || baseDir;
    dirContents = fs.readdirSync(currentDir);
    _.forEach(dirContents, function(item){
        if (fs.statSync(path.join(currentDir,item)).isDirectory()) {
            files = _.union(files, createDirectoryIndexes(results, baseDir, path.join(currentDir, item)));
        } else if (item !== 'index.html') {
            files.push({fileName: path.join(path.relative(baseDir, currentDir), item)});
        }
    });

    new IndexHtmlBuilder(baseDir).createIndexFile(currentDir, files);
    return files;
}
