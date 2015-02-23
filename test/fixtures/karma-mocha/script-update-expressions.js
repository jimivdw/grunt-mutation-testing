(function (exports) {
    exports.incrementA = function (x) {
        return ++x < 10;
    };

    exports.decrementA = function (x) {
        return --x > 10;
    };

    exports.incrementB = function (x) {
        return x++ < 10;
    };

    exports.decrementB = function (x) {
        return x-- > 10;
    };
})(this);
