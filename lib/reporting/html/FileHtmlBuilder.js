/**
 * Created by Martin Koster on 3/2/15.
 */
var fs = require('fs');
var FileHtmlBuilder=  function(source){
    this._source = source;
};

FileHtmlBuilder.prototype.createFileReports = function(fileResult, baseDir) {
    //var templateHtml = fs.readFileSync(__dirname + '/templates/file.html', 'utf-8'),
    //    fileTemplate = HandleBars.compile(templateHtml),
    //    source = this._source;
    //    html;
    //
    //directoryNode.forEach(function (fileResult){
    //
    //});
    console.log('createFileReports', baseDir, fileResult);
    if (fileResult.length) {
        fs.writeFileSync(baseDir+"/"+fileResult[0].fileName+".html", "file test");
    }
};

module.exports = FileHtmlBuilder;
