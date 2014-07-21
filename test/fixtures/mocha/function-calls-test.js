var assert = require("chai").assert;
var functionCalls = require("./function-calls")

describe('Function Calls', function () {

  it('encodeUrl', function () {
    var result = functionCalls.encodeUrl('abc');
    assert.equal(result, 'abc');
  });

  it('trim', function () {
    var result = functionCalls.trim('abc');
    assert.equal(result, 'abc');
  });

});
