function onLoad() {
    each(document.getElementsByClassName('code'), function(element) {
        element.addEventListener('mouseover', onMouseOver, false);
        element.addEventListener('mousemove', onMouseMove, false);
        element.addEventListener('mouseout', onMouseOut, false);
    });
}

function each(list, fn, thisArg) {
    Array.prototype.forEach.call(list, fn, thisArg);
}

function onMouseOver(event) {
    var popup = document.getElementById('popup');
    addMutations(popup, event.target);
    setPopupPosition(popup, event);
    popup.classList.add("show");
}

function onMouseMove(event) {
    setPopupPosition(document.getElementById('popup'), event);
}

function onMouseOut() {
    document.getElementById('popup').classList.remove('show');
}

function addMutations(popup, target) {
    var mutationEl;

    each(target.classList, function(_class) {
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

var showKilledMutations = true;
function toggleKilledMutations() {
    showKilledMutations = !showKilledMutations;

    if(showKilledMutations) {
        document.querySelector('#toggleKilledMutations').innerHTML = 'Hide killed mutations';
        each(document.querySelectorAll('.code.killed'), function(e) {
            e.style.backgroundColor = '';
        });
        each(document.querySelectorAll('#mutations .killed'), function(e) {
            e.style.display = '';
        });
    } else {
        document.querySelector('#toggleKilledMutations').innerHTML = 'Show killed mutations';
        each(document.querySelectorAll('.code.killed'), function(e) {
            e.style.backgroundColor = 'white';
        });
        each(document.querySelectorAll('#mutations .killed'), function(e) {
            e.style.display = 'none';
        });
    }
}

function setPopupPosition(popup, event) {
    var top = event.clientY,
        left = event.clientX + 10;

    popup.setAttribute('style', 'top:' + top + 'px;left:' + left + 'px;');
}

window.onload = onLoad;
