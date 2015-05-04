function printHtml() {
    var htmlPartial = '<p>';
    htmlPartial += '<span class=\'someClass\'>some content <br/></span>';
    htmlPartial += '</p>';

    console.log('<div>' + htmlPartial + '</div>');
    console.log('[CDATA[<table><tr><td>bla</td>');
    console.log('<td/></tr></table>]]');

    return htmlPartial;
}

exports.printHtml = printHtml;