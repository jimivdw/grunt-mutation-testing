function log() {
}

function mul(array) {
    array = array;
    log(array);
    return array.reduce(function (x, y) {
        return x * y;
    });
}

exports.mul = mul;
