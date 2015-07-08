/**
 * Templates
 *
 * @author Jimi van der Woning
 */
'use strict';
var fs = require('fs'),
    Handlebars = require('handlebars'),
    path = require('path');

/**
 * Read a file from the template folder
 * @param fileName name of the file to read
 */
function readTemplateFile(fileName) {
    return fs.readFileSync(path.join(__dirname, 'templates', fileName), 'utf-8');
}

// Templates from files
var baseTemplateCode = readTemplateFile('base.hbs'),
    baseScriptTemplateCode = readTemplateFile('baseScript.hbs'),
    baseStyleTemplateCode = readTemplateFile('baseStyle.hbs'),
    folderTemplateCode = readTemplateFile('folder.hbs'),
    fileTemplateCode = readTemplateFile('file.hbs'),
    folderFileRowTemplateCode = readTemplateFile('folderFileRow.hbs');

// Hardcoded templates
var segmentLinkTemplateCode = '<a class="link {{status}}" href="{{segment}}/index.html">{{folder}}</a>{{{separator}}}',
    fileLinkTemplateCode = '<a class="link {{status}}" href="{{path}}">{{file}}</a>';

// Templates
module.exports.baseTemplate = Handlebars.compile(baseTemplateCode);
module.exports.baseScriptTemplate = Handlebars.compile(baseScriptTemplateCode);
module.exports.baseStyleTemplate = Handlebars.compile(baseStyleTemplateCode);
module.exports.folderTemplate = Handlebars.compile(folderTemplateCode);
module.exports.fileTemplate = Handlebars.compile(fileTemplateCode);
module.exports.folderFileRowTemplate = Handlebars.compile(folderFileRowTemplateCode);
module.exports.segmentLinkTemplate = Handlebars.compile(segmentLinkTemplateCode);
module.exports.fileLinkTemplate = Handlebars.compile(fileLinkTemplateCode);

// Static code
module.exports.folderStyleCode = readTemplateFile('folderStyle.css');
module.exports.fileStyleCode = readTemplateFile('fileStyle.css');
module.exports.fileScriptCode = readTemplateFile('fileScript.js');

Handlebars.registerHelper('json', function(context) {
    return encodeURI(JSON.stringify(context));
});
