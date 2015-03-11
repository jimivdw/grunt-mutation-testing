/**
 * IO relates utilities
 * Created by Martin Koster on 3/2/15.
 */
var fs = require('fs'),
    pathAux = require('path'),
    Q = require('q'),
    _ = require('lodash');

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
 * creates a directory path if it doesn't exist
 * @param {string, Array} path path to create
 * @param {string} parentDir parent directory to create paht from
 */
module.exports.createPathIfNotExists = function createPathIfNotExists(path, parentDir) {
    var directoryList = (path === 'string') ? path.split(pathAux.sep) : path;

    _.forEach(directoryList, function(segment) {
        parentDir += '/' + segment;
        this.createDirIfNotExists(parentDir);
    }, this);
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

module.exports.promiseToReadFile = function promiseToReadFile(fileName) {
    return Q.Promise(function(resolve, reject){
        fs.readFile(fileName, 'utf-8', function(error, data) {
            if (error) {
                console.log('error reading', error);
                reject(error);
            } else {
                console.log('read success');
                resolve(data);
            }
        });
    });
};

module.exports.promiseToWriteFile = function promiseToWriteFile(fileName, data) {
    return Q.Promise(function(resolve, reject){
        fs.writeFile(fileName, data, function(error, data) {
            if (error) {
                console.log('error writing', error);
                reject(error);
            } else {
                console.log('write success');
                resolve(data);
            }
        });
    });
};
