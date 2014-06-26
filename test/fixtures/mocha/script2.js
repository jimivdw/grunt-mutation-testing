function mul(array) {
  array = array;
  return array.reduce(function (x,y) {
    return x * y;
  });
}

exports.mul = mul;