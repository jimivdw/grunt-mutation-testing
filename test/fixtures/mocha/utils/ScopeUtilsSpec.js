/**
 * Created by Martin Koster on 25/02/15.
 */
var esprima = require('esprima'),
    expect = require('chai').expect,
    FunctionScopeUtils = require('../../../../utils/ScopeUtils');


describe('ScopeUtils', function(){
    it('should remove loop variables if the function scope has an overriding variable with same identifier', function(){
        var node = esprima.parse('var x=1;'),
            loopVariables = ['x', 'y', 'z'];

        expect(JSON.stringify(FunctionScopeUtils.removeOverriddenLoopVariables(node, loopVariables))).to.equal('["y","z"]');
    });

    it('should remove nested loop variables if somewhere in the code block a variable with same identifier is overridden', function(){
        var node,
            loopVariables = ['x', 'y', 'z'];

        function nestedBlocks(d) {
            var z = 1;
            if (d < z) {
                for (var i=z; i<d; i++) {
                    if (d * i < 50) {
                        var y = d^2;
                        z = z + y;
                    }
                }
            }
        }

        node = esprima.parse(nestedBlocks.toString()).body[0].body;
        expect(JSON.stringify(FunctionScopeUtils.removeOverriddenLoopVariables(node, loopVariables))).to.equal('["x"]');
    });

    it('should not remove nested loop variables if somewhere in the function another function with a variable with same identifier is overridden (beyond scope)', function(){
        var node,
            loopVariables = ['index', 'array', 'length'];

        function nestedBlocks(array) {
            var sum = 0;
            for (var i = 0; i < array.length; i++) {
                var length = 0;
                var dummy = function() {
                    var array = []
                };
                sum += array[i];
            }
            if (dummy()) {
                sum += 0;
            }
            return sum;
        }

        node = esprima.parse(nestedBlocks.toString()).body[0].body;
        expect(JSON.stringify(FunctionScopeUtils.removeOverriddenLoopVariables(node, loopVariables))).to.equal('["index","array"]');
    });
});
