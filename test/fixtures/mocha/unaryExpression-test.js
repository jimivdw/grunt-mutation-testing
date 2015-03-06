var assert = require("chai").assert;
var expect = require("chai").expect;
var unaryExpression = require("./unaryExpression");

describe('Unary Expression', function () {
    it('getBinaryExpression', function () {
        assert.isNumber(unaryExpression.getBinaryExpression());
    });
    it('getNumber', function () {
        assert.isNumber(unaryExpression.getNumber());
    });
    it('getBitwiseNotNumber', function () {
        assert.isNumber(unaryExpression.getBitwiseNotNumber());
    });
    it('getNegativeBoolean', function () {
        expect(!!unaryExpression.getNegativeBoolean()).to.be.true;
    });
    it('getBoolean', function () {
        assert.isBoolean(unaryExpression.getBoolean());
    });
    it('getNumberBoolean', function () {
        assert.isBoolean(unaryExpression.getNumberBoolean());
    });
});
