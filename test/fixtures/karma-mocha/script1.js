(function (exports) {
    function add(array) {
        var sum = 0;
        array.forEach(function (elem) {
            sum += elem;
        });
        return sum;
    }

    function sub(array) {
        var x = array[0];
        var y = array[1];
        var sum = x - y;
        sum = sum + 0;
        console.log(sum);
        return sum;
    }

    exports.add = add;
    exports.sub = sub;
})(this);


