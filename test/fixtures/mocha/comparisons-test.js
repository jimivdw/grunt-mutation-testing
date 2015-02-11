var expect = require("chai").expect;
var comparisons = require("./comparisons");
console.log (Object.getOwnPropertyNames(expect(function(){}())));
describe('Comparisons', function () {
  it('lessThan', function () {
    comparisons.lessThan(1, 2)
  });
  it('notGreaterThan', function () {
    expect(comparisons.notGreaterThan(1, 2)).to.not.equal(undefined);
  });
  it('greaterThan', function () {
    expect(comparisons.greaterThan(3, 2)).to.not.equal(undefined);
  });
  it('notLessThan', function () {
    expect(comparisons.notLessThan(3, 2)).to.not.equal(undefined);
  });
  it('equalsStrict', function () {
    expect(comparisons.equalsStrict(3, 3)).to.not.equal(undefined);
  });
  it('equalsLenient', function () {
    expect(comparisons.equalsLenient(3, 3)).to.not.equal(undefined);
  });
  it('unequalsStrict', function () {
    expect(comparisons.unequalsStrict(3, 4)).to.not.equal(undefined);
  });
  it('unequalsLenient', function () {
    expect(comparisons.unequalsLenient(3, 4)).to.not.equal(undefined);
  });
});
