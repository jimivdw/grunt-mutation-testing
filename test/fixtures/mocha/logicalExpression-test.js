
var assert = require("chai").assert;
var expect = require("chai").expect;
var logicalExpression = require("./logicalExpression");

describe('Logical Expression', function () {
    it('getBooleanAnd', function () {
        assert.isBoolean(logicalExpression.getBooleanAnd());
    });
    it('getBooleanOr', function () {
        assert.isBoolean(logicalExpression.getBooleanOr());
    });
});
