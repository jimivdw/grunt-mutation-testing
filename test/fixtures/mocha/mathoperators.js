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
