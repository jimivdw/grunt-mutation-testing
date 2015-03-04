function onLoad() {
    Array.prototype.forEach.call(document.getElementsByClassName('code'), function(element) {
        element.addEventListener('mouseover', debounce(onMouseOver, 200), false);
        element.addEventListener('mouseout', debounce(onMouseOut, 200), false);
    });
}

function onMouseOver(event) {
    var popup = document.getElementById('popup');
    addMutations(popup, event.target);
    setPopupPosition(popup, event);
    popup.classList.add("show");
}

function onMouseOut() {
    document.getElementById('popup').classList.remove('show');
}

function addMutations(popup, target) {
    var mutationEl;

    Array.prototype.forEach.call(target.classList, function(_class) {
        if (_class.indexOf('mutation_') > -1) {
            mutationEl = document.getElementById(_class);
            if (Array.prototype.indexOf.call(mutationEl.classList, 'killed') > -1) {
                popup.classList.add('killed');
                popup.classList.remove('survived');
            } else {
                popup.classList.add('survived');
                popup.classList.remove('killed');
            }
            popup.classList.add(mutationEl.classList);
            popup.innerHTML = mutationEl.innerHTML;
        }
    });
}

function setPopupPosition(popup, event) {
    var top = event.clientY + document.body.scrollTop,
        left = event.clientX;

    popup.setAttribute('style', 'top:' + top + 'px;left:' + left + 'px;');
}

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
//
// (copied from http://davidwalsh.name)
function debounce(func, wait, immediate) {
    var timeout;
    return function() {
        var context = this, args = arguments;
        var later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}
