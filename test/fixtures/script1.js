function add(array) {
  var sum = 0;
  for (var i = 0; i < array.length; i++) {
    sum += array[i];
  }

  return sum;
}

function sub(array) {
  var x = array[0];
  var y = array[1];
  var sum;
  console.log(x);
  sum = x - y;
  return sum;
}

exports.add = add;
exports.sub = sub;
