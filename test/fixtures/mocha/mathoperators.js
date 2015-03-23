(function(exports) {
    exports.addOperator = function (a, b) {
        return a + b + b;
    };

    exports.subtractOperator = function (a, b) {
        return a - (b + b);
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

    /* some blabla */
    exports.modulusOperator = function (a, b) {
        return a % b;
    };
})(exports);
