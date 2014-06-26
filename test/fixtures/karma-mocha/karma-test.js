describe('Fixtures', function () {
  describe('Script 1', function () {
    it('add', function () {
      var actual = add([1, 2]);
      var expected = 3;
      assert.equal(actual, expected);
    });
    it('sub', function () {
      var actual = sub([2, 1]);
      var expected = 1;
      assert.equal(actual, expected);
    });
  });

  describe('Script 2', function () {
    it('mul', function () {
      assert.equal(6, mul([2, 3]));
      //test.equal(6, 6);
    });
  });
});
