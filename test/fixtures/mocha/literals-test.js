var assert = require("chai").assert;
var literals = require("./literals")

describe('Literals', function () {
  it('getString', function () {
    assert.isString(literals.getString());
  });
  it('getNumber', function () {
    assert.isNumber(literals.getNumber());
  });
  it('getString', function () {
    assert.isBoolean(literals.getBoolean());
  });
});
