var assert = require("chai").assert;
var args = require("./arguments");

describe('Arguments', function () {
    it('containsName', function () {
        var result = args.containsName([
            {name: 'Nora'},
            {name: 'Marco'}
        ], 'Stefe');
        assert.equal(result, false);
    });
});
