var _spa = (function () {
    var updateStateListeners = [];
    var templates = null;
    var presenter = null;

    function start(options) {
        var templatePaths = options.templates.map(function(t) {return t.path});
        readFiles(templatePaths, function(data) {
            data.sort(function(o1, o2) {return o1.index - o2.index});
            data = data.map(function(r, i) {return (r.id = options.templates[i].id, r.getState = options.templates[i].getState, r)});
            templates = data;
            presenter = options.presenter;
            options.onLoadTemplates ? options.onLoadTemplates(presenter) : presenter();
            // options.presenter(data);
        })
    }

    function readFiles(files, callback) {
        var ajaxCallsRemaining = files.length;
        var returned = [];
        for (var i = 0, len = files.length; i < len; i++) {
            (function(i) {
                readFile(files[i], function(response) {
                    returned.push({
                        content: response,
                        path: files[i],
                        index: i,
                    });
                    --ajaxCallsRemaining;
                    if (ajaxCallsRemaining <= 0) {
                        callback(returned);
                    }
                });
            })(i)
        }
    }

    function readFile(file, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", file, true);
        xhr.onload = function (e) {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    callback(xhr.responseText);
                } else {
                    console.error(xhr.statusText);
                }
            }
        };
        xhr.onerror = function (e) {
            console.error(xhr.statusText);
        };
        xhr.send(null);
    }

    function updateTemplates(templates) {
        for (var i = 0, len = templates.length; i < len; i++) {
            var getStateIsDefined = typeof templates[i].getState === "function";
            var state = typeof templates[i].getState === "function" ? templates[i].getState() : null;
            if ((getStateIsDefined && state) || (!getStateIsDefined)) {
                var html = parseTemplate(templates[i].content, state);
                insertTemplate(html, templates[i].id);
            }
        }
    }

    function insertTemplate(template, selector) {
        var element = document.getElementById(selector);
        element.innerHTML = template;
    }

    function parseTemplate(html, options) {
        var re = /<%([^%>]+)?%>/g, reExp = /(^( )?(if|for|else|switch|case|break|{|}))(.*)?/g, code = 'var r=[];\n', cursor = 0, match;
        var add = function(line, js) {
            js? (code += line.match(reExp) ? line + '\n' : 'r.push(' + line + ');\n') :
                (code += line != '' ? 'r.push("' + line.replace(/"/g, '\\"') + '");\n' : '');
            return add;
        }
        while(match = re.exec(html)) {
            add(html.slice(cursor, match.index))(match[1], true);
            cursor = match.index + match[0].length;
        }
        add(html.substr(cursor, html.length - cursor));
        code += 'return r.join("");';
        return new Function(code.replace(/[\r\t\n]/g, '')).apply(options);
    }

    function onUpdateState(callback) {
        updateStateListeners.push(callback);
    }

    function updateState() {
        for (var i = 0, len = updateStateListeners.length; i < len; i++) {
            updateStateListeners[i]();
        }
        updateTemplates(templates);
        presenter();
    }

    return {
        start: start,
        parseTemplate: parseTemplate,
        updateState: updateState,
        onUpdateState: onUpdateState,
        readFile: readFile,
        readFiles: readFiles,
    }
})();