Array.prototype.move = function (old_index, new_index) {
    while (old_index < 0) {
        old_index += this.length;
    }
    while (new_index < 0) {
        new_index += this.length;
    }
    if (new_index >= this.length) {
        var k = new_index - this.length;
        while ((k--) + 1) {
            this.push(undefined);
        }
    }
    this.splice(new_index, 0, this.splice(old_index, 1)[0]);
    return this; // for testing purposes
};

String.prototype.hashCode = function () {
    var hash = 0;
    if (this.length == 0) return hash;
    for (i = 0; i < this.length; i++) {
        char = this.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}

var MYHASH = ((+new Date()) + '').hashCode();

function AddNode(parent, elType, text) {
    var node = document.createElement(elType);
    if(text) {
        node.innerHTML = text.split('&nbsp;').join(' ');
    }
    parent.appendChild(node);
    return node;
}

function AddNodeHtml(parent, elType, text) {
    var node = document.createElement(elType);
    if (text) {
        node.innerHTML = text;
    }
    parent.appendChild(node);
    return node;
}

function AddTableCellNode(row, text) {
    return AddNodeHtml(row, 'td', text);
}

function setCaret(el) {
    var range = document.createRange();
    var sel = window.getSelection();
    range.setStart(el, el.childNodes.length);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    el.focus();
}

function setCaretStart(el) {
    var range = document.createRange();
    var sel = window.getSelection();
    range.setStart(el.childNodes[0], 0);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    el.focus();
}

function GetStorage(key, cb, errCB) {
    if (chrome && chrome.storage) {
        chrome.storage.sync.get(key, function (result) {
            if (result[key]) {
                cb && cb(result[key].data);
            } else {
                errCB && errCB();
            }
        });
    } else {
        cb && cb(localStorage.getItem(key));
    }
}

function SetStorage(key, data) {
    var payload = {};
    payload[key] = {
        data: data,
        id: MYHASH
    };
    if (chrome && chrome.storage) {
        chrome.storage.sync.set(payload);
    } else {
        localStorage.setItem(key, data);
    }
}


if (chrome && chrome.storage) {
    chrome.storage.onChanged.addListener(function (changes, namespace) {
        for (key in changes) {
            var storageChange = changes[key];
            console.log(storageChange);
            if (key == currentTab && storageChange.newValue.id != MYHASH) {
                document.getElementById("editor-content").innerHTML = storageChange.newValue.data;
            }
            console.log('Storage key "%s" in namespace "%s" changed. ' +
                'Old value was "%s", new value is "%s".',
                key,
                namespace,
                storageChange.oldValue,
                storageChange.newValue);
        }
    });
}

var currentTab = "content-default";

function ChkAddClick(chk, cb) {
    chk.addEventListener('click', function () {
        console.log(chk.getAttribute('checked'));
        var spans = chk.parentElement.getElementsByTagName('span');

        if (chk.getAttribute('checked') != 'checked') {
            chk.setAttribute('checked', 'checked');
            for (var i = 0; i < spans.length; i++) {
                spans[i].setAttribute('style', 'text-decoration: line-through');
            }
        } else {
            chk.removeAttribute('checked');
            for (var i = 0; i < spans.length; i++) {
                spans[i].setAttribute('style', '');
            }
        }

        cb && cb();
    });
}

function FixStyles() {
    //console.log(document.getElementById("editor-content"), document.getElementById("editor-content").children);

    var divs = document.querySelectorAll('#editor-content div, #editor-content u, #editor-content span');
    for (var i=0, len = divs.length; i<len; i++){
        divs[i].setAttribute('class', '');
        if(divs[i].innerHTML.startsWith('###')) {
            divs[i].setAttribute('class', 'very-large');
        } else if(divs[i].innerHTML.startsWith('##')) {
            divs[i].setAttribute('class', 'large');
        } else if(divs[i].innerHTML.startsWith('#')) {
            divs[i].setAttribute('class', 'medium');
        }
    }
}

function FixClicks(cb) {
    var chks = document.querySelectorAll('#editor-content input[type=checkbox]');
    for (var i = 0, len = chks.length; i < len; i++) {
        ChkAddClick(chks[i], cb);
    }
}

function wrapTextNode(textNode) {
    var spanNode = document.createElement('div');
    var newTextNode = document.createTextNode(textNode.textContent);
    spanNode.appendChild(newTextNode);
    textNode.parentNode.replaceChild(spanNode, textNode);
    return spanNode;
}

document.addEventListener('DOMNodeInserted', function(node) {
    if(node.type != 'DOMNodeInserted') {
    return;
    }
    if(node.srcElement.nodeName != '#text') {
    return;
    }
    if(node.srcElement.parentNode.getAttribute('id') != 'editor-content') {
    return;
    }
    if(node.target.textContent == '') {
    return;
    }

    var wrappedNode = wrapTextNode(node.srcElement);
    setCaret(wrappedNode);
});

// Store
var editable = document.querySelectorAll('div[contentEditable]');

function pasteHtmlAtCaret(html) {
    var sel, range;
    if (window.getSelection) {
        // IE9 and non-IE
        sel = window.getSelection();
        if (sel.getRangeAt && sel.rangeCount) {
            range = sel.getRangeAt(0);
            range.deleteContents();

            // Range.createContextualFragment() would be useful here but is
            // only relatively recently standardized and is not supported in
            // some browsers (IE9, for one)
            var el = document.createElement("div");
            el.innerHTML = html;
            var frag = document.createDocumentFragment(), node, lastNode;
            while ( (node = el.firstChild) ) {
                lastNode = frag.appendChild(node);
            }
            var result = range.insertNode(frag);

            // Preserve the selection
            if (lastNode) {
                range = range.cloneRange();
                range.setStartAfter(lastNode);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
            }

            return lastNode;
        }
    } else if (document.selection && document.selection.type != "Control") {
        // IE < 9
        document.selection.createRange().pasteHTML(html);
    }
}

function createCheckboxAt(el, cb) {
    var chk = document.createElement('input');
    chk.setAttribute('type', 'checkbox');
    ChkAddClick(chk, cb);
    el.appendChild(chk);
    var spn = document.createElement('span');
    spn.innerText = ' ';
    el.appendChild(spn);
}

function AddCheckbox(cb) {
    var el = pasteHtmlAtCaret('<div></div>');
    el.setAttribute('data-checkbox', 'true');
    createCheckboxAt(el, cb);
    return el;
}

function Editable(editable) {

    editable.setAttribute('data-orig', editable.innerHTML);
    function SaveInner() {
        FixStyles();
        if (editable.innerHTML == editable.getAttribute('data-orig')) {
            // no change
        }
        else {
            // change has happened, store new value
            SetStorage(currentTab, editable.innerHTML);
        }
    }
    editable.onblur = SaveInner;
    editable.onkeydown = function (e) {
        if (e.key == 'C' && e.shiftKey && e.ctrlKey) {
            // insert a checkbox
            var el = getSelectionStart();

            var div = document.createElement('div');
            createCheckboxAt(div, SaveInner);
            el.parentElement.appendChild(div);
            div.setAttribute('data-checkbox', 'true');
            setCaret(div);
            
            //var el = AddCheckbox(SaveInner);
            //setCaret(el);
        } else if (e.key == 'Enter') {

            function getSelectionStart() {
                var node = document.getSelection().anchorNode;
                return (node.nodeType == 3 ? node.parentNode : node);
            }
            var el = getSelectionStart();
            var parentNode = el.parentNode;
            console.log(el, el.parentNode);
            var isCheckboxNode =
                (el.children.length > 0 && el.children[0].getAttribute('type') == 'checkbox') ||
                (parentNode.children.length > 0 && parentNode.children[0].getAttribute('type') == 'checkbox');

            if (isCheckboxNode && el.innerText.split(' ').join('') != '') {
                console.log('Its a checkbox, with text');

                var div = document.createElement('div');
                createCheckboxAt(div, SaveInner);
                el.parentElement.parentElement.appendChild(div);                
                div.setAttribute('data-checkbox', 'true');
                setCaret(div);

                e.preventDefault();

            } else if (isCheckboxNode) {
                el.parentNode.parentNode.removeChild(el.parentNode);
            } else {
                console.log('Its not a checkbox');
            }
        }
        return true;
    };
    editable.onkeyup = SaveInner;
    editable.addEventListener("paste", function (e) {
        // cancel paste
        e.preventDefault();

        // get text representation of clipboard
        var text = e.clipboardData.getData("text/plain");

        // insert text manually
        document.execCommand("insertHTML", false, text);
    });
}

for (var i = 0, len = editable.length; i < len; i++){
    Editable(editable[i]);
}

window.onkeydown = function (event) {
    if (event.ctrlKey && event.shiftKey && event.key == 'C') {
        event.preventDefault();
        return false;
    }
};

function AddClass(el, cls) {
    var classes = el.getAttribute('class');
    if(classes.indexOf(cls) > -1) {
        return;
    }
    el.setAttribute('class', classes + ' ' + cls);
}
function RemoveClass(el, cls) {
    var classes = el.getAttribute('class');
    el.setAttribute('class', classes.split(cls).join(''));
}
function ToggleClass(el, cls) {
    var classes = el.getAttribute('class');
    if(classes.indexOf(cls) > -1) {
        RemoveClass(el, cls);
    } else {
        AddClass(el, cls);
    }
}

function ResetTabs() {
    var tabs = document.querySelectorAll('div[data-tab]');
    for (var i=0, len = tabs.length; i<len; i++) {
    RemoveClass(tabs[i], 'active');
    }
}

window.addEventListener('storage', function() {
    GetStorage(currentTab, function (data) {
        document.getElementById("editor-content").innerHTML = data;
    });
}, false);



// Retrieve
GetStorage(currentTab, function (data) {
    var editable = document.getElementById("editor-content");
    editable.innerHTML = data;

    FixClicks(function () {
        SetStorage(currentTab, editable.innerHTML);
    });
});

function theme(t) {
    document.getElementById("app").setAttribute('class', 'editor-theme-' + t);
    SetStorage('theme', t);
}

var themeVal;
GetStorage('theme', function (data) {
    themeVal = data;
    if (!themeVal) {
        themeVal = 'light';
    }
    theme(themeVal);
});

function settings() {
    var tab = this.getAttribute('data-tab');
    console.log(tab);
    ResetTabs();
    AddClass(this, 'active');

    RemoveClass(document.getElementById("settings"), 'hidden');
    AddClass(document.getElementById('app'), 'show-settings');
}

var settingToggle = document.querySelectorAll('.settings-toggle');
for (var i = 0, len = settingToggle.length; i < len; i++) {

    settingToggle[i].addEventListener('click', settings);
}

var tabArray = [];
GetStorage('tabs', function (data) {
    tabArray = JSON.parse(data);
    if (!tabArray) {
        tabArray = [
            { name: 'Extra Notes', id: 'extra-notes' }
        ];
    }
    BuildEditTabList();
    BuildTabList();
}, function () {
    // hasn't been filled out yet
    SetStorage(currentTab, '<span>### Welcome</span><br /><span>Try typing anywhere</span>');
    });




function BuildTabList() {
    var tabLoc = document.getElementById("tab-loc");
    tabLoc.innerHTML = '';
    var firstNode = AddNode(tabLoc, 'div', 'Remark');
    if(document.getElementById("settings-tab").getAttribute('class').indexOf('active') == -1) {
        firstNode.setAttribute('class', 'tab active');
    } else {
        firstNode.setAttribute('class', 'tab');
    }
    firstNode.setAttribute('data-tab', 'default');
    for(var i = 0; i < tabArray.length; i++) {
        var rowNode = AddNode(tabLoc, 'div', tabArray[i].name);
        rowNode.setAttribute('class', 'tab');
        rowNode.setAttribute('data-tab', tabArray[i].id);
    }

    var tabs = document.querySelectorAll('#tab-loc div[data-tab]');
    for (var i=0, len = tabs.length; i<len; i++) {
        if(tabs[i].innerHTML.startsWith(' ')) {
            AddClass(tabs[i], 'child');
        }
        tabs[i].addEventListener('click', function () {
            AddClass(document.getElementById("settings"), 'hidden');
            var tab = this.getAttribute('data-tab');
            ResetTabs();
            AddClass(this, 'active');
            currentTab = "content-" + tab;
            RemoveClass(document.getElementById('app'), 'show-settings');

            console.log('Get storage');

            GetStorage(currentTab, function (data) {
                var editable = document.getElementById("editor-content");
                editable.innerHTML = data;
                editable.focus();
                setCaret(document.getElementById('editor-content'));
                console.log('Fix clicks');
                FixClicks(function () {
                    SetStorage(currentTab, editable.innerHTML);
                });
            }, function () {
                document.getElementById("editor-content").innerHTML = '';
                var emptyNode = AddNode(document.getElementById('editor-content'), 'div', ' ');
                document.getElementById('editor-content').focus();
                setCaretStart(document.getElementById('editor-content'));
            });

        });
    }

    SetStorage('tabs', JSON.stringify(tabArray));
}

function BuildEditTabList() {

    var tabList = document.getElementById("tab-list");
    tabList.innerHTML = '';

    for(var i = 0; i < tabArray.length; i++) {
        var rowNode = document.createElement('tr');

        var upNode = AddTableCellNode(rowNode);
            AddNode(upNode, 'img').setAttribute('src', 'arrow-up.png');
            upNode.setAttribute('data-index', i);
            upNode.addEventListener('click', function () {
                var ind = parseInt(this.getAttribute('data-index'));
                tabArray.move(ind, ind - 1);
                BuildEditTabList();
                BuildTabList();
            });
        var downNode = AddTableCellNode(rowNode);
            AddNode(downNode, 'img').setAttribute('src', 'arrow-down.png');
            downNode.setAttribute('data-index', i);
            downNode.addEventListener('click', function () {
                var ind = parseInt(this.getAttribute('data-index'));
                var targ = ind + 1;
                if (ind + 1 >= tabArray.length) {
                    targ = 0;
                }
                tabArray.move(ind, targ);
                BuildEditTabList();
                BuildTabList();
            });

        var nameNode = AddTableCellNode(rowNode, tabArray[i].name);
            nameNode.setAttribute('contenteditable', 'true');
            nameNode.setAttribute('data-index', i);

            nameNode.setAttribute('data-orig', nameNode.innerHTML);
            function SaveNameInner() {
                var ind = parseInt(this.getAttribute('data-index'));
                tabArray[ind].name = this.innerText;
                BuildEditTabList();
                BuildTabList();
            }
            nameNode.onblur = SaveNameInner;
            nameNode.onkeypress = function(e) {
                if(e.key == 'Enter') {
                    SaveNameInner.apply(this);
                    e.stopPropagation();
                    return false;
                }
                return true;
            };

        var delNode = AddTableCellNode(rowNode);
            AddNode(delNode, 'img').setAttribute('src', 'remove.png');
            delNode.setAttribute('data-index', i);
            delNode.addEventListener('click', function () {
                if (confirm('Are you sure you want to delete this tab?')) {
                    var ind = parseInt(this.getAttribute('data-index'));
                    tabArray.splice(ind, 1);
                    BuildEditTabList();
                    BuildTabList();
                }
            });

        tabList.appendChild(rowNode);
    }

}

document.getElementById('create-tab').addEventListener('click', function () {
    var nameVal = document.getElementById('new-tab-name').value;
    if (nameVal) {
        tabArray.push({
            name: nameVal,
            id: nameVal
        });
        document.getElementById('new-tab-name').value = '';
        BuildEditTabList();
        BuildTabList();
    }
});
BuildEditTabList();
BuildTabList();



var themes = document.querySelectorAll('a[data-theme]');
for (var i=0, len = themes.length; i<len; i++) {
    themes[i].addEventListener('click', function () {
        console.log('set theme');
        theme(this.getAttribute('data-theme'));
    });
}


document.getElementById('app').addEventListener('click', function (e) {
    var cls = e.target.getAttribute('class');
    if (!cls) return;
    if (e.target.getAttribute('class').indexOf('refocus') > -1) {
        document.getElementById('editor-content').focus();
    }
});

document.getElementById('customcssinput').addEventListener('keyup', function () {
    document.getElementById('customcss').innerHTML = this.value;
    SetStorage('customcss', this.value);
});

GetStorage('customcss', function (data) {
    document.getElementById('customcssinput').value = data;
    document.getElementById('customcss').innerHTML = data;
});