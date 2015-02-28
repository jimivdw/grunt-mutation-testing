var assert = require("chai").assert;
var attribute = require("./attribute");

describe('Attributes', function () {
    it('createPerson', function () {
        var person = attribute.createPerson('Marco', 36);
        assert.isObject(person);
//    assert.equal('Marco', person.name);
//    assert.equal(36, person.age);
    });
});
