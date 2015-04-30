function log() {
    var htmlPartial = '<span class=\'someClass\'>some content</span>';
    console.log('<div>' + htmlPartial + '</div>');
}

function mul(array) {
    array = array;
    log(array);
    return array.reduce(function (x, y) {
        return x * y;
    });
}

exports.mul = mul;
