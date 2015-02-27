/**
 * This generator creates the coverage file with is used to generate the coverage report.
 *
 * Created by Merlin Weemaes on 2/26/15.
 */
var istanbul = require('istanbul');
var fs = require('fs');
var statementCoverage  = {"1": 1,"2": 0},
    branchCoverage  = {},
    functionCoverage  = {"1": 0},
    lineCoverage  = {
        "1": 1,
        "2": 0
    },
    functionMapping  = {
    "1": {
        "name": "getAAAA",
            "line": 1,
            "loc": {
            "start": {
                "line": 1,
                    "column": -45
            },
            "end": {
                "line": 1,
                    "column": 3
            }
        }
    }
},
    statementMapping  = {
        "1": {
            "start": {
                "line": 1,
                "column": -45
            },
            "end": {
                "line": 3,
                "column": 1
            }
        },
        "2": {
            "start": {
                "line": 2,
                "column": 1
            },
            "end": {
                "line": 3,
                "column": 0
            }
        }

    },
    branchMapping  = {};

exports.generate = function (opts) {
    var filename = "./test/testProgramForReport.js";
    var coverageObject  = {};
    coverageObject[filename] = {
        "path" : filename,
        "s" : statementCoverage,
        "b" : branchCoverage,
        "f" : functionCoverage,
        "fnMap" : functionMapping,
        "statementMap" : statementMapping,
        "branchMap" : branchMapping,
        "l" : lineCoverage
    }
    fs.writeFileSync(opts.dir + "/coverage.json", JSON.stringify(coverageObject), 'UTF8');
    console.log('generating coverage file is done');
}
