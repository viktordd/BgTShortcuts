(function($, chrome) {

    jQuery.fn.extend({
        getPath: function() {
            if (this.length === 0) {
                throw 'Requires one element.';
            }
            var path = [], node = this;

            while (node.length) {
                var realNode = node[0], name = realNode.localName;
                if (!name) { break; }
                name = name.toLowerCase();

                var parent = node.parent();

                var sameTagSiblings = parent.children(name);
                if (sameTagSiblings.length > 1) {
                    var index = parent.children().index(realNode) + 1;
                    name += ':nth-child(' + index + ')';
                }

                path.unshift(name);
                node = parent;
            }

            return path.join('>');
        }
    });

    var bgTorrentsShortcuts = {
        /**
		 * Shortcuts
		 *
		 * @type {array<object>}
		 * @private
		 * 
		 * ArenaBG - http://arenabg.com/torrents/
		 * ArenaBG TV Епизоди - http://arenabg.com/torrents/type:tvepisodes
		 * Zamunda - http://zamunda.net/browse.php
		 * Zamunda Филми - http://zamunda.net/browse.php?&c7=1&c50=1&c19=1&incldead=0
		 * Zamunda Сериали - http://zamunda.net/browse.php?cat=7
		 * Zamunda.se - http://zelka.org/browse.php
		 * Zamunda.se Филми - http://zelka.org/browse.php?&c7=1&c50=1&c19=1&incldead=0
		 * Zamunda.se Сериали - http://zelka.org/browse.php?cat=7
		 */
        shortcuts_: {},
        position_: { v: 'top', h: 'left' },
        /**
		 * URL Input
		 *
		 * @type {jQuery}
		 * @private
		 */
        url_: null,

        /**
		 * Submit Button
		 *
		 * @type {jQuery}
		 * @private
		 */
        btn_: null,

        /**
		 * Tab ID
		 *
		 * @type {int}
		 * @private
		 */
        tabID_: 0,

        /**
		 * Initialize
		 *
		 * @public
		 */
        init: function(tab) {
            var $this = this;
            if (typeof tab === 'number') {
                this.tabID_ = tab;
            }

            //Get URL input, and Go btn
            this.getInputAndBtn_();

            //Auto Log-in
            //If already logged in, and there is a saved goto URL that is different than the curr one set it and click the goto button
            if (document.readyState === "complete") {
                this.checkGoToShortcut();
            } else {
                $(window).on('load', function() {
                    $this.checkGoToShortcut();
                });
            }

            // Add ctrl-right click event to print the clicked element's path to console.
            $(document).on('contextmenu', 'button, input:submit, input:text, input:password', function(e) {
                if (e.ctrlKey) {
                    var path = $(e.target).getPath();
                    console.log(path);
                    return false;
                }
                return true;
            });

            //Add Shortcut Container Divs, and render all shortcuts
            this.getAllShortcuts_(function(shorctus) {
                if ($this.initShortcuts_(shorctus)) { // Shortcuts will not initialize if there is a shortcut parameter in the url
                    //If the current page is bgtorrents.info get all highlights
                    if ($.url().attr('host') == "bgtorrents.info") {
                        this.getAllHighlights_(this.hightlight_);
                    }
                }
            });

            //Register listenes for change in saved data.
            chrome.storage.onChanged.addListener(function(changes, areaName) {
                if (changes.highlights && $.url().attr('host') == "bgtorrents.info") {
                    $this.hightlight_(JSON.parse(changes.highlights.newValue));
                }
            });
        },



        /**
		 * Check if there's a goto shortcut, get it and click goto button
		 *
		 * @private
		 */
        checkGoToShortcut: function() {
            var $this = this;
            this.autoLogIn_(function() {
                if ($this.url_.val().search(/login/i) < 0) {
                    $this.getCurrShortcut_(function(shortcut) {
                        if (shortcut && $this.setURL_(shortcut, false)) {
                            $this.btn_.click();
                        }
                    });
                }
            });
        },

        /**
		 * Auto Log in
		 *
		 * @private
		 */
        autoLogIn_: function(func) {
            var $this = this;
            this.getLogInOpts_(function(autoLogIn) {
                if (autoLogIn.enabled === true) {
                    for (var i = 0; i < autoLogIn.list.length; i++) {
                        var item = autoLogIn.list[i];
                        var user = $(item.UserSel);
                        var pass = $(item.PassSel);
                        var btn = $(item.BtnSel);
                        if (user.length > 0 && pass.length > 0 && btn.length > 0) {
                            user.val(item.User);
                            pass.val(item.Pass);
                            btn.click();
                            return;
                        }
                    }
                }
                func.call($this);
            });
        },

        /**
		 * Add Shortcut Container Divs, and render all shortcuts
		 *
		 * @private
		 */
        getInputAndBtn_: function() {
            var parent = $('#webproxyform');
            if (parent.length === 0) { //bgtorrentz.info
                parent = $('body > div#include');

                this.url_ = parent.find('input:text[name=u]');
                this.btn_ = parent.find('input:submit[value=Go]');
            } else {//bgtorrentz.net
                this.url_ = parent.find('input:text[name=u]');
                this.btn_ = parent.find('input:submit[value=Open]');
            }
        },

        /**
		 * Add shortcut divs.
		 *
		 * @private
		 */
        initShortcuts_: function(shortcuts) {
            var $this = this;
            this.shortcuts_ = shortcuts;
            var sName = $.url().param('URL');
            var i = this.findShortcut_(sName);

            // If there is a shortcut param in the url set the url and go.
            if (i >= 0 && this.setURL_(shortcuts[i], true)) {
                this.btn_.click();
                return false;
            } else {
                //Listen for shortcut click event
                $(window).on({
                    'shortcutClick': function(e, shortcut) {
                        $this.onShortcutClick_(shortcut);
                    },
                    'shRefreshPage': function(e) {
                        $this.onRefresh_();
                    }
                });
                //Bootstrap angular to display shortcuts
                var div = $('<div data-ng-include="\'shortcuts.html\'" data-ng-controller="shortcutsController" data-ng-init="showRefresh=' + this.refreshEnabled_() + '" ></div>').appendTo($('body'));
                angular.bootstrap(div[0], ['shortcutsApp']);
                return true;
            }
        },

        /**
		 * Highlights text
		 *
		 * @private
		 */
        hightlight_: function(highlights) {
            $('span.bgt-highlight').each(function() {
                var $span = $(this);
                $span.replaceWith($span.html());
            });

            var i;
            var regexSearch = [];
            for (i = 0; i < highlights.length; i++) {
                regexSearch.push(new RegExp("(" + highlights[i] + ")", "gi"));
            }

            $('a').each(function() {
                var $a = $(this);
                if ($a.children().length > 0)
                    $a = $a.children().first();
                var replaced = false;
                for (i = 0; i < regexSearch.length; i++) {
                    $a.html($a.html().replace(regexSearch[i], function(token) {
                        replaced = true;
                        return "<span class='bgt-highlight'>" + token + "</span>";
                    }));
                    if (replaced) {
                        break;
                    }
                }
            });
        },

        /**
		 * Checks shortcut name
		 *
		 * @param {String} sName 
		 * @private
		 */
        findShortcut_: function(sName) {
            if (typeof sName !== 'string') { return -1; }
            for (var i = 0; i < this.shortcuts_.length; i++) {
                if (this.shortcuts_[i].Name === sName) { return i; }
            }
            return -1;
        },

        /**
		 * Checks shortcut name
		 *
		 * @param {Object} shortcut 
		 * @param {Boolean} save 
		 * @param {Boolean} force 
		 * @private
		 */
        setURL_: function(shortcut, save, force) {
            var url = $.url();
            if (url.attr('host') === "bgtorrentz.net" && url.attr('directory') !== "/zamunda-net/") {
                this.setCurrShortcut_(shortcut);
                location.replace("http://bgtorrentz.net/zamunda-net/");
            }
            if (force === true || shortcut.URL !== this.url_.val()) {
                if (save) {
                    this.setCurrShortcut_(shortcut);
                }
                this.url_.val(shortcut.URL);
                return true;
            } else {
                this.removeCurrShortcut_();
                return false;
            }
        },

        /**
		 * Handle the 'click' event of all shortcuts.
		 *
		 * @param {Event} e: The Click Event.
		 * @private
		 */
        onClick_: function(e) {
            var shortcut = $(e.currentTarget).data('ShortcutData');
            if (shortcut && this.setURL_(shortcut, true, true)) {
                this.btn_.click();
            }
        },

        refreshEnabled_: function() {
            return ($.url().attr('host') == "bgtorrents.info" && this.url_.val().length > 0);
        },

        onRefresh_: function() {
            if (!this.refreshEnabled_())
                return;

            this.setURL_({ Name: '__refresh__', URL: this.url_.val() }, true, true);
            this.btn_.click();
        },

        onShortcutClick_: function(shortcut) {
            if (shortcut && this.setURL_(shortcut, true, true)) {
                this.btn_.click();
            }
        },

        /**
		 * Gets stored data
		 *
		 * @param {function} func: callback funciton of type func(highlights)
		 * @private
		 */
        getAllHighlights_: function(func) {
            var $this = this;
            chrome.storage.local.get('highlights', function(items) {
                func.call($this, items.highlights ? JSON.parse(items.highlights) : []);
            });
        },

        /**
		 * Gets stored data
		 *
		 * @param {function} func: callback funciton of type func(shortcuts)
		 * @private
		 */
        getAllShortcuts_: function(func) {
            var $this = this;
            chrome.storage.local.get('shortcuts', function(items) {
                func.call($this, items.shortcuts ? JSON.parse(items.shortcuts) : []);
            });
        },

        /**
		 * Gets stored data
		 *
		 * @param {function} func: callback funciton of type func(shortcuts)
		 * @private
		 */
        getLogInOpts_: function(func) {
            var $this = this;
            chrome.storage.local.get('autoLogIn', function(items) {
                func.call($this, items.autoLogIn ? JSON.parse(items.autoLogIn) : { enabled: false, list: [] });
            });
        },

        /**
		 * Gets stored data
		 *
		 * @param {function} func: callback funciton of type func(currShortcut)
		 * @private
		 */
        getAllCurrShortcut_: function(func) {
            var $this = this;
            chrome.storage.local.get('currShortcut', function(items) {
                func.call($this, items.currShortcut ? JSON.parse(items.currShortcut) : {});
            });
        },

        /**
		 * Gets stored data
		 *
		 * @param {function} func: callback funciton of type func(currShortcut)
		 * @private
		 */
        getCurrShortcut_: function(func) {
            this.getAllCurrShortcut_(function(currShortcut) {
                var data = currShortcut[this.tabID_];
                func.call(this, data);
            });
        },

        /**
		 * Gets stored data
		 *
		 * @param {Object} data: Data to save
		 * @private
		 */
        setCurrShortcut_: function(data) {
            this.getAllCurrShortcut_(function(currShortcut) {
                currShortcut[this.tabID_] = data;
                chrome.storage.local.set({
                    currShortcut: JSON.stringify(currShortcut)
                });
            });
        },

        /**
		 * Gets stored data
		 *
		 * @private
		 */
        removeCurrShortcut_: function() {
            this.getAllCurrShortcut_(function(currShortcut) {
                delete currShortcut[this.tabID_];
                chrome.storage.local.set({
                    currShortcut: JSON.stringify(currShortcut)
                });
            });
        }
    };

    chrome.runtime.sendMessage({
        method: 'get_tab'
    }, function(tab) {
        bgTorrentsShortcuts.init(tab.id);
    });
})($, chrome);