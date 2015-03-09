/**
 * IO relates utilities
 * Created by Martin Koster on 3/2/15.
 */
var fs = require('fs'),
    Q = require('q');

/**
 * returns a list of directories, given a path
 * @param {String} path path to dissect
 * @param {boolean} [excludeLastSegment] exclude last segment of the path (can sometimes be a file name), DEFAULT false
 * @returns {Array} the directory segments in the path
 */
module.exports.getDirectoryList = function getDirectoryList(path, excludeLastSegment) {
    var pathRegex = /([^\\\/]+)/g,
        currentSegment,
        segment = pathRegex.exec(path),
        directoryList = [];

    //console.log(segment);
    while (segment) {
        currentSegment = segment[0];
        segment = pathRegex.exec(path);
        if (!excludeLastSegment || segment) {
            directoryList.push(currentSegment);
        }
    }

    //console.log(directoryList);
    return directoryList;
};

/**
 * creates a new directory if it doesn't exist
 * @param {string} newDir new directory to create
 */
module.exports.createDirIfNotExists = function createDirIfNotExists(newDir) {
    try {
        fs.statSync(newDir);
    } catch (e) {
        fs.mkdirSync(newDir);
    }
};

module.exports.readFileInPromise = function readFileInPromise(fileName) {
    return Q.Promise(function(resolve, reject){
        fs.readFile(fileName, function(error, data) {
            if (error) {
                reject(error);
            } else {
                resolve(data);
            }
        });
    });
};

module.exports.writeFileInPromise = function writeFileInPromise(fileName, data) {
    return Q.Promise(function(resolve, reject){
        fs.writeFile(fileName, data, function(error, data) {
            if (error) {
                reject(error);
            } else {
                resolve(data);
            }
        });
    });
};
