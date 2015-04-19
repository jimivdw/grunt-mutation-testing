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

/**
 * multiplies some stuff
 * @excludeMutations
 * @param array
 * @returns {number}
 */
function mul(array) {
    var x = array[0];
    var y = array[1];
    var sum = x * y;
    if (sum > 9){
        console.log(sum);
    }
    return sum;
}

exports.add = add;
exports.sub = sub;

//@excludeMutations
exports.mul = mul;

console.log = function() {
    // Mock console log to prevent output from leaking to mutation test console
};
