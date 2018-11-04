var state = {
    list: null,
    panel: null,
    modalNew: {
        show: false,
        id: "create",
        title: "Новая заметка",
        message: "<input id='new_item_text' placeholder='Новая заметка' autofocus type='text'/><div style='margin-top: 10px;'><input type='checkbox' id='type-complex' name='type' value='type' /><label for='type-complex'>сложная</label></div>",
        buttonText: "Добавить",
    },
    modalDeleteComplex: {
        show: false,
        id: "delete-complex",
        title: "Подтверждение удаления",
        message: "Для удаление сложных заметок требуется подтверждение.",
        buttonText: "Удалить",
        options: false,
    },
};

_spa.start({
    templates: [
        {
            id: 'main',
            path: '/todolist/src/view/main.view',
        },
        {
            id: 'add-new-item',
            path: '/todolist/src/view/add-new-item.view',
        },
        {
            id: 'list',
            path: '/todolist/src/view/list.view',
            getState: function() {return state.list},
        },
        {
            id: 'panel',
            path: '/todolist/src/view/panel.view',
            getState: function() {return state.panel},
        },
        {
            id: 'modal-window-new-item',
            path: '/todolist/src/view/modal-window.view',
            getState: function() {return state.modalNew},
        },
        {
            id: 'modal-window-delete-item',
            path: '/todolist/src/view/modal-window.view',
            getState: function() {return state.modalDeleteComplex},
        },
    ],
    onLoadTemplates: setState,
    presenter: presenter,
});

function setState(presenter) {
    _spa.readFile('/todolist/src/model/list.json', function (data) {
        state.list = JSON.parse(data);
        _spa.updateState(state);
        presenter();
    });
}

function presenter() {
    var addItemBtn = document.getElementById("add-new-item-btn");
    addItemBtn.onclick = function() {
        state.modalNew.show = true;
        _spa.updateState(state);
    }

    var createNewItemConfirm = document.getElementById("confirm_create");
    if (createNewItemConfirm) {
        createNewItemConfirm.onclick = function() {
            var input = document.getElementById("new_item_text");
            var type = document.getElementById("type-complex").checked ? "complex" : "simple";
            var text = input.value.trim();
            if (text) {
                var item = {
                    type: type,
                    value: text,
                    selected: false,
                };
                if (type === "complex") {
                    item.color = "green";
                }
                state.list.push(item);
                state.modalNew.show = false;
                _spa.updateState(state);
            }
        }
    }

    var closeModal = document.getElementById("close_create");
    if (closeModal) {
        closeModal.onclick = function() {
            state.modalNew.show = false;
            _spa.updateState(state);
        }
    }

    var deleteElementBtns = document.getElementsByClassName("delete-item");
    for (var i in deleteElementBtns) {
        (function(i){
            deleteElementBtns[i].onclick = function(e) {
                e.stopPropagation();
                var type = deleteElementBtns[i].getAttribute("data-type");
                if (type === "complex") {
                    state.modalDeleteComplex.show = true;
                    state.modalDeleteComplex.options = i;
                    _spa.updateState(state);
                } else if (type === "simple") {
                    state.list.splice(i, 1);
                    _spa.updateState(state);
                }
                return false;
            }
        })(i)
    }

    var closeDeleteModal = document.getElementById("close_delete-complex");
    if (closeDeleteModal) {
        closeDeleteModal.onclick = function() {
            state.modalDeleteComplex.show = false;
            _spa.updateState(state);
        }
    }

    var confirmDeleteItem = document.getElementById("confirm_delete-complex");
    if (confirmDeleteItem) {
        confirmDeleteItem.onclick = function() {
            var i = confirmDeleteItem.getAttribute("data-options");
            state.list.splice(i, 1);
            state.modalDeleteComplex.show = false;
            _spa.updateState(state);
        }
    }

    var items = document.getElementsByClassName("list-item");
    if (items) {
        for (var i = 0, len = items.length; i < len; i++) {
            (function(i) {
                function onSingleClick() {
                    state.list[i].selected = !state.list[i].selected;
                    _spa.updateState(state);
                }
                function onDoubleClick() {
                    if (state.list[i].type === "complex") {
                        if (state.list[i].color === "red") {
                            state.list[i].color = "green";
                            _spa.updateState(state);
                        } else {
                            state.list[i].color = "red";
                            _spa.updateState(state);
                        }
                    }
                }
                items[i].onclick = forkClicks(onSingleClick, onDoubleClick, 300);
            })(i)
        }
    }

    function forkClicks(onSingle, onDouble, period) {
        var cntClick = 0;
        var timeout;
        return function() {
            if (cntClick === 0) {
                ++cntClick;
                timeout = setTimeout(
                    function() {
                        onSingle();
                        cntClick = 0;
                    }, period
                );
            } else {
                clearTimeout(timeout);
                onDouble();
                cntClick = 0;
            }
        }
    }
}

_spa.onUpdateState(function() {
    if (state.list) {
        state.panel = state.list.reduce(function(acc, val) {
            return {
                green: acc.green + (val.color === "green" ? 1 : 0),
                red: acc.red + (val.color === "red" ? 1 : 0),
                all: acc.all + 1,
                simple: acc.simple + (val.type === "simple" ? 1 : 0),
                complex: acc.complex + (val.type === "complex" ? 1 : 0),
                selected: acc.selected + (val.selected ? 1 : 0),
            }
        }, {green:0, red:0, all: 0, simple: 0, complex: 0, selected: 0});
    }
});