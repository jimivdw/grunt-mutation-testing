(function (exports) {
    exports.addOperator = function (a, b) {
        return a + b;
    };

    exports.subtractOperator = function (a, b) {
        return a - b;
    };

    exports.multiplyOperator = function (a, b) {
        return a * b;
    };

    exports.divideOperator = function (a, b) {
        if (b > 0) {
            return a / b;
        }
        return 0;
    };

    exports.modulusOperator = function (a, b) {
        return a % b;
    };

    exports.looping = function (array) {
        var prev = 0, _new;
        for (var i = 0; i < array.length; i = i + 1) { // purposefully incrementing like this to let the arithmetic mutation cause an infinite loop
            _new = prev + array[i];
            prev = array[i];
            array[i] = _new;
        }
        return array;
    };
})(this);
