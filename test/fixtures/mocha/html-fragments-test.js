var assert = require("chai").assert;
var expect = require("chai").expect;
var scriptWithHtml = require("./html-fragments");

describe('Script with HTML', function () {
    it('prints HTML', function () {
        expect(scriptWithHtml.printHtml()).to.contain('<p>');
    });
});
