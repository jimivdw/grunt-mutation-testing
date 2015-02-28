describe('Update expressions', function () {
    it('increment A', function () {
        var x = 1;
        expect(incrementA(x)).to.equal(true);
    });

    it('decrement A', function () {
        var x = 1;
        expect(decrementA(x)).to.equal(false);
    });

    it('increment B', function () {
        var x = 100;
        expect(incrementB(x)).to.equal(false);
    });

    it('decrement B', function () {
        var x = 100;
        expect(decrementB(x)).to.equal(true);
    });
});
