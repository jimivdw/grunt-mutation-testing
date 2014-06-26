(function (exports) {
  function mul(array) {
    return array.reduce(function (x, y) {
      return x * y;
    });
  }

  exports.mul = mul;
})(this);

