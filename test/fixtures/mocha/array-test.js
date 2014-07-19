var assert = require("chai").assert;
var arrayModule = require("./array")

describe('Arrays', function () {
  it('createArray', function () {
    var array = arrayModule.createArray();
    assert.isArray(array);
//    assert.deepEqual(array, [
//      {},
//      'string',
//      123
//    ]);
  });
});
