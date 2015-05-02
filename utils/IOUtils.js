/**
 * IO relates utilities
 * Created by Martin Koster on 3/2/15.
 */
var fs = require('fs'),
    os = require('os'),
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

    while (segment) {
        currentSegment = segment[0];
        segment = pathRegex.exec(path);
        if (!excludeLastSegment || segment) {
            directoryList.push(currentSegment);
        }
    }

    return directoryList;
};

/**
 * creates a directory path if it doesn't exist
 * @param {string, Array} path path to create
 * @param {string} parentDir parent directory to create path from
 */
module.exports.createPathIfNotExists = function createPathIfNotExists(path, parentDir) {
    var directoryList = (path === 'string') ? path.split(pathAux.sep) : path;

    _.forEach(directoryList, function(segment) {
        parentDir = pathAux.join(parentDir, segment);
        this.createDirIfNotExists(parentDir);
    }, this);
};

/**
 * Normalize windows path to use forward slashes instead of backslashes
 * @param {string} path the path to normalize
 * @returns {string} normalized path
 */
module.exports.normalizeWindowsPath = function(path) {
    // Normalize Windows paths to use '/' instead of '\\'
    if(os.platform() === 'win32') {
        path = path.replace(/\\/g, '/');
    }
    return path;
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

/**
 * Read a file that may not be present yet. Keep trying every (interval || 100) milliseconds.
 *
 * @param fileName {string} the file that should be read
 * @param maxWait {number=} maximum time that should be waited for the file to be read
 * @param interval {number=} [interval] number of milliseconds between each try, DEFAULT: 100
 * @returns {promise|*|Q.promise} a promise that will resolve with the file contents or rejected with any error
 */
module.exports.readFileEventually = function(fileName, maxWait, interval) {
    var self = this,
        dfd = Q.defer();

    interval = interval || 100;

    self.promiseToReadFile(fileName).then(function(data) {
        dfd.resolve(data);
    }, function(error) {
        if(maxWait > 0) {
            setTimeout(function() {
                dfd.resolve(self.readFileEventually(fileName, maxWait - interval, interval));
            }, interval);
        } else {
            dfd.reject(error);
        }
    });

    return dfd.promise;
};

/**
 * Try to find a file eventually. Keep trying every (interval || 100) milliseconds.
 *
 * @param fileName {string}
 * @param path {string}
 * @param maxDepth {number=}
 * @param maxWait {number=} maximum time that should be waited for the file to be read
 * @param interval {number=} [interval] number of milliseconds between each try, DEFAULT: 100
 * @returns {promise|*|Q.promise} a promise that will resolve with the file contents or rejected with any error
 */
module.exports.findEventually = function(fileName, path, maxDepth, maxWait, interval) {
    var self = this,
        dfd = Q.defer();

    interval = interval || 100;

    self.find(fileName, path, maxDepth).then(function(filePath) {
        dfd.resolve(filePath);
    }, function(error) {
        if(maxWait > 0) {
            setTimeout(function() {
                dfd.resolve(self.findEventually(fileName, path, maxDepth, maxWait - interval, interval));
            }, interval);
        } else {
            dfd.reject(error);
        }
    });

    return dfd.promise;
};

/**
 * Find a file recursively in a given path.
 *
 * @param fileName {string} name of the file that should be found
 * @param path {string} path to the directory in which the file should be found
 * @param maxDepth {number=} maximum directory depth for finding the file. When undefined or negative, it will continue indefinitely
 * @returns {*|promise} a promise that will resolve with the path to the file, or be rejected with any error
 */
module.exports.find = function(fileName, path, maxDepth) {
    var self = this,
        deferred = Q.defer();

    self.promiseToReadDir(path).then(function(directoryContents) {
        var contentPromises = [];
        _.forEach(directoryContents, function(item) {
            var itemPath = pathAux.join(path, item);
            contentPromises.push(Q.Promise(function(resolve, reject) {
                self.promiseToStat(itemPath).then(function(stats) {
                    if(stats.isDirectory()) {
                        if(maxDepth !== 0) {
                            resolve(self.find(fileName, itemPath, maxDepth - 1));
                        } else {
                            reject(new Error('Reached max. depth of ' + maxDepth));
                        }
                    } else {
                        if(item === fileName) {
                            resolve(itemPath);
                        } else {
                            reject(new Error('File ' + item + ' does not match ' + fileName));
                        }
                    }
                }, function(error) {
                    reject(error);
                })
            }));
        });

        Q.allSettled(contentPromises).spread(function() {
            var resolvedPromise = _.find(arguments, function(contentPromise) {
                return contentPromise.state === "fulfilled";
            });
            resolvedPromise ? deferred.resolve(resolvedPromise.value) :
                deferred.reject(new Error('Could not find ' + fileName));
        });
    }, function(error) {
        deferred.reject(new Error('Could not read dir "' + path + '": ' + error.message));
    });

    return deferred.promise;
};

module.exports.promiseToReadFile = function promiseToReadFile(fileName) {
    return Q.Promise(function(resolve, reject){
        fs.readFile(fileName, 'utf-8', function(error, data) {
            error ? reject(error) : resolve(data);
        });
    });
};

module.exports.promiseToWriteFile = function promiseToWriteFile(fileName, data) {
    return Q.Promise(function(resolve, reject){
        fs.writeFile(fileName, data, function(error, data) {
            error ? reject(error) : resolve(data);
        });
    });
};

module.exports.promiseToReadDir = function promiseToReadDir(directory) {
    return Q.Promise(function(resolve, reject){
        fs.readdir(directory, function(error, data) {
            error ? reject(error) : resolve(data);
        });
    });
};

module.exports.promiseToStat = function promiseToStat(directory) {
    return Q.Promise(function(resolve, reject){
        fs.stat(directory, function(error, data) {
            error ? reject(error) : resolve(data);
        });
    });
};

