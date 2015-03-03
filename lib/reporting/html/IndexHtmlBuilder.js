/**
 * Created by Martin Koster on 3/3/15.
 */
var HandleBars = require("handlebars"),
    fs = require('fs');

var IndexHtmlBuilder = function(baseDir){
    this._baseDir = baseDir;
};

IndexHtmlBuilder.prototype.createIndexFile = function(directoryTree){
    var indexSource = fs.readFileSync(__dirname + '/templates/index.html', 'utf-8'),
        indexTemplate = HandleBars.compile(indexSource);

    fs.writeFileSync(this._baseDir+"/index.html", this._baseDir + " test");
};

module.exports = IndexHtmlBuilder;
