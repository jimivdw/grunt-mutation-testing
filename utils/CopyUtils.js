'use strict';
/**
 * Utility functions for copying files
 *
 * @module CopyUtils 
 * @author Jimi van der Woning
 */

var fs = require('fs-extra'),
    glob = require('glob'),
    _ = require('lodash'),
    path = require('path'),
    q = require('q'),
    temp = require('temp');

// Remove files after the process
//temp.track();

/**
 * Copy a file or array of files to a temporary directory. File paths may contain wildcards,
 * e.g. test/*Spec.js
 *
 * @param {string | array} files filepath or array of filepaths that will be copied
 * @param {string} tempDirName (optional) name of the temporary directory to copy to
 * @returns a promise that will resolve when all files have successfully been copied
 */
function copyToTemp(files, tempDirName) {
    if(!_.isArray(files)) { files = [files]; }
    tempDirName = tempDirName || "copyToTemp-dir";

    var deferred = q.defer();

    temp.mkdir(tempDirName, function(err, tempDirPath) {
        try {
            if(err) { throw err; }
            
            files.forEach(function(filePath) {
                // Resolve all wildcards in the filePath
                var globbedFilePaths = glob.sync(filePath, { dot: true });
                
                globbedFilePaths.forEach(function(gfp) {
                    fs.copySync(gfp, path.join(tempDirPath, gfp));
                });
            });
            
            deferred.resolve(tempDirPath);
        } catch(err) {
            deferred.reject(err);
        }
    });
    
    return deferred.promise;
}

module.exports.copyToTemp = copyToTemp;

