/**
 * Created by Martin Koster on 3/3/15.
 */
var HandleBars = require("handlebars"),
    fs = require('fs'),
    _ = require('lodash');

var IndexHtmlBuilder = function(baseDir){
    this._baseDir = baseDir;
};

IndexHtmlBuilder.prototype.createIndexFile = function(files){
    var indexSource = fs.readFileSync(__dirname + '/templates/index.html', 'utf-8'),
        indexTemplate = HandleBars.compile(indexSource),
        listItems = '';

    _.forEach(files, function(file){
        listItems = listItems.concat('<li>', file.fileName, '</li>');
    }, this);

    fs.writeFileSync(this._baseDir+"/index.html", indexTemplate({listItems:listItems}));
};

module.exports = IndexHtmlBuilder;
