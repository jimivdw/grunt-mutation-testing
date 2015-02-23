describe('Math operators', function () {
    it('add', function () {
        expect(addOperator(4, 0)).to.equal(4);
    });

    it('subtract', function () {
        expect(subtractOperator(4, 0)).to.equal(4);
    });

    it('multiply', function () {
        expect(multiplyOperator(4, 1)).to.equal(4);
    });

    it('divide', function () {
        expect(divideOperator(4, 1)).to.equal(4);
    });

    it('divide - handle dividing by 0 situation', function () {
        expect(divideOperator(4, 0)).to.equal(0);
    });

    it('modulus', function () {
        expect(modulusOperator(0, 1)).to.equal(0);
    });

    it('modulus', function () {
        expect(JSON.stringify(asserts = looping([0, 1, 2, 3]))).to.equal('[0,1,3,5]');
    });

});
