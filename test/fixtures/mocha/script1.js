function add(array) {
    var sum = 0;
    for (var i = 0; i < array.length; i = i + 1) {
        sum += array[i];
    }
    return sum;
}

function sub(array) {
    var x = array[0];
    var y = array[1];
    var sum = x - y;
    sum = sum + 0;
    console.log(sum);
    return sum;
}

exports.add = add;
exports.sub = sub;
