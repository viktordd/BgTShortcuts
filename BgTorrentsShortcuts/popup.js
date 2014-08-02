angular.module('bgtShortcutsBkgr', ['ui.bootstrap', 'ui.sortable']).controller('bgtShortcutsCtrl', function($scope) {

    $scope.sortableOptions = {
        placeholder: "sort-item",
        stop: function(e, ui) {
            $scope.shortcuts.save();
        }
    };

    //Highlights
    $scope.highlights = {
        list: [],
        curr: "",
        currEdit: "",
        editIndex: -1,
        undo: { index: -1, item: null },

        load: function() {
            chrome.storage.local.get('highlights', function(items) {
                $scope.$apply(function() {
                    var list = (items.highlights ? JSON.parse(items.highlights) : []);
                    for (var i = 0; i < list.length; i++) {
                        if (list[i].$$hashKey)
                            delete list[i].$$hashKey;
                    }
                    $scope.highlights.list = list;
                });
            });
        },

        save: function() {
            chrome.storage.local.set({
                highlights: JSON.stringify(this.list)
            });
        },

        add: function() {
            if (this.curr.length === 0 || this.list.indexOf(this.curr) >= 0 || !this.isValid(this.curr)) {
                return;
            }

            this.list.push(this.curr);
            this.list.sort(function(a, b) {
                return a.toLowerCase().localeCompare(b.toLowerCase());
            });

            this.save();
            this.curr = "";
        },

        saveEdit: function(index) {
            if (this.currEdit.length === 0 || this.list.indexOf(this.currEdit) >= 0 || !this.isValid(this.currEdit)) {
                return;
            }

            this.list[index] = this.currEdit;
            this.list.sort(function(a, b) {
                return a.toLowerCase().localeCompare(b.toLowerCase());
            });

            this.save();
            this.editIndex = -1;
        },

        remove: function(i) {
            if (i < 0 && i >= this.list.length) return;

            this.undo = { index: i, item: this.list.splice(i, 1)[0] };
            this.save();
        },

        undoRemove: function() {
            if (this.undo.index < 0) return;

            this.list.splice(this.undo.index, 0, this.undo.item);
            this.undo.index = -1;
            this.undo.item = null;
            this.save();
        },

        isValid: function(expr) {
            try {
                var r = RegExp(expr);
                return true;
            }
            catch (e) {
                return false;
            }
        },
    };

    // Shortcuts
    $scope.shortcuts = {
        list: [],
        curr: { Name: '', URL: '' },
        empty: { Name: '', URL: '' },
        undo: { index: -1, item: null },

        load: function() {
            chrome.storage.local.get('shortcuts', function(items) {
                $scope.$apply(function() {
                    var list = (items.shortcuts ? JSON.parse(items.shortcuts) : []);
                    for (var i = 0; i < list.length; i++) {
                        if (list[i].$$hashKey)
                            delete list[i].$$hashKey;
                    }

                    $scope.shortcuts.list = list;
                });
            });
        },

        save: function() {
            chrome.storage.local.set({
                shortcuts: JSON.stringify(this.list)
            });
        },

        add: function() {
            if (this.curr.Name.length === 0 || this.curr.URL.length === 0) return;
            var i = this.find(this.curr.Name);
            if (i >= 0) {
                this.list[i] = this.curr;
            } else {
                this.list.push(this.curr);
            }
            this.save();
            this.clear();
        },

        edit: function(i) {
            if (i < 0 && i >= this.list.length) return;
            this.curr = angular.copy(this.list[i]);
        },

        remove: function(i) {
            if (i < 0 && i >= this.list.length) return;

            this.undo = { index: i, item: this.list.splice(i, 1)[0] };
            this.save();
        },

        undoRemove: function() {
            if (this.undo.index < 0) return;

            this.list.splice(this.undo.index, 0, this.undo.item);
            this.undo.index = -1;
            this.undo.item = null;
            this.save();
        },

        find: function(name) {
            if (name === undefined) name = this.curr.Name;
            for (var i = 0; i < this.list.length; i++) {
                if (this.list[i].Name === name) return i;
            }
            return -1;
        },

        clear: function() {
            this.curr = angular.copy(this.empty);
        },
    };

    // Position
    $scope.position = {
        curr: { v: 'top', h: 'left' },

        load: function() {
            chrome.storage.local.get('position', function(items) {
                $scope.$apply(function() {
                    var pos = (items.position ? JSON.parse(items.position) : $scope.position.curr);
                    if (pos.$$hashKey) {
                        delete pos.$$hashKey;
                    }

                    $scope.position.curr = pos;
                });
            });
        },

        save: function() {
            chrome.storage.local.set({
                position: JSON.stringify(this.curr)
            });
        },

        set: function(vertical, horizontal) {
            if (typeof vertical === "string") {
                this.curr.v = vertical;
            }
            if (typeof horizontal === "string") {
                this.curr.h = horizontal;
            }
            this.save();
        },

        is: function(vertical, horizontal) {
            return this.curr.v === vertical && this.curr.h === horizontal;
        }
    };

    //Auto Log-in
    $scope.autoLogIn = {
        enabled: false,
        list: [],
        curr: { Name: '', User: '', Pass: '', UserSel: '', PassSel: '', BtnSel: '' },
        empty: { Name: '', User: '', Pass: '', UserSel: '', PassSel: '', BtnSel: '' },
        undo: { index: -1, item: null },
        _showError: false,

        load: function() {
            chrome.storage.local.get('autoLogIn', function(items) {
                $scope.$apply(function() {
                    var autoLogIn = (items.autoLogIn ? JSON.parse(items.autoLogIn) : { enabled: false, list: [] });
                    for (var i = 0; i < autoLogIn.list.length; i++) {
                        if (autoLogIn.list[i].$$hashKey)
                            delete autoLogIn.list[i].$$hashKey;
                    }
                    $scope.autoLogIn.enabled = autoLogIn.enabled;
                    $scope.autoLogIn.list = autoLogIn.list;
                });
            });
        },

        save: function() {
            chrome.storage.local.set({
                autoLogIn: JSON.stringify({
                    enabled: this.enabled,
                    list: this.list
                }),
            });
        },

        add: function() {
            if (!this.isValid(this.curr)) {
                this._showError = true;
                return;
            }
            var i = this.find(this.curr.Name);
            if (i >= 0) {
                this.list[i] = this.curr;
            } else {
                this.list.push(this.curr);
            }
            this.list.sort(function(a, b) {
                return a.Name.toLowerCase().localeCompare(b.Name.toLowerCase());
            });

            this.save();
            this.clear();
        },

        edit: function(i) {
            if (i < 0 && i >= this.list.length) return;
            this.curr = angular.copy(this.list[i]);
        },

        remove: function(i) {
            if (i < 0 && i >= this.list.length) return;

            this.undo = { index: i, item: this.list.splice(i, 1)[0] };
            this.save();
            this.clear();
        },

        undoRemove: function() {
            if (this.undo.index < 0) return;

            this.list.splice(this.undo.index, 0, this.undo.item);
            this.undo.index = -1;
            this.undo.item = null;
            this.save();
        },

        find: function(name) {
            if (name === undefined) name = this.curr.Name;
            for (var i = 0; i < this.list.length; i++) {
                if (this.list[i].Name === name) return i;
            }
            return -1;
        },

        isValid: function(item) {
            return item.Name.length > 0 &&
                item.User.length > 0 &&
                item.Pass.length > 0 &&
                item.UserSel.length > 0 &&
                item.PassSel.length > 0 &&
                item.BtnSel.length > 0;
        },

        check: function(item) {
            return this._showError && item.length === 0;
        },

        clear: function() {
            this._showError = false;
            this.curr = angular.copy(this.empty);
        },
    };

    $scope.highlights.load();
    $scope.shortcuts.load();
    $scope.position.load();
    $scope.autoLogIn.load();
});