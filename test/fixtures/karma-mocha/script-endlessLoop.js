/**
 * Created by martin on 25/03/15.
 * @excludeMutations
 */
(function(exports) {
    exports.provokeEndlessLoop = function(opts) {
        var modulus = -1;
        while(opts.input.length > 0) {
            var temp = '';
            if (opts.input.length > 5) {
                temp = opts.input.substring(0, 6);
            } else {
                temp = opts.input;
                opts.input = '';
            }

            var count = temp;
            modulus = count % 83;
            if (opts.input.length > 5) {
                opts.input = modulus + opts.input.substring(6)
            }
        }
        return modulus;
    };
})(this);
