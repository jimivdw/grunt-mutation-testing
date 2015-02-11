var expect = require("chai").expect;
var comparisons = require("./comparisons");
console.log (Object.getOwnPropertyNames(expect(function(){}())));
describe('Comparisons', function () {
  it('lessThan', function () {
    expect(comparisons.lessThan(1, 2)).to.be.equal(true);
  });
  it('notGreaterThan', function () {
    expect(comparisons.notGreaterThan(2, 2)).to.be.equal(true);
  });
  it('greaterThan', function () {
    expect(comparisons.greaterThan(3, 2)).to.be.equal(true);
  });
  it('notLessThan', function () {
    expect(comparisons.notLessThan(3, 3)).to.be.equal(true);
  });
  it('equalsStrict', function () {
    expect(comparisons.equalsStrict(3, "3")).to.be.equal(false);
  });
  it('equalsLenient', function () {
    expect(comparisons.equalsLenient(3, "3")).to.be.equal(true);
  });
  it('unequalsStrict', function () {
    expect(comparisons.unequalsStrict(3, "3")).to.be.equal(true);
  });
  it('unequalsLenient', function () {
    expect(comparisons.unequalsLenient(3, "3")).to.be.equal(false);
  });
});
