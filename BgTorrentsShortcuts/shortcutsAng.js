angular.module('shortcutsApp', [])
    .directive('sToggle', function() {
        return {
            link: function(scope, element, attr) {
                scope.$watch(attr.sToggle, function(value) {
                    if (value) {
                        element.show('fast');
                    } else {
                        element.hide('fast');
                    }
                });
            }
        };
    })
    .controller('shortcutsController', function($scope) {
        $scope.showIcon = false;
        $scope.showHolder = false;
        $scope.showRefresh = false;
        $scope.shortcuts = [];
        $scope.position = {
            top: true,
            middle: false,
            bottom: false,
            left: true,
            center: false,
            right: false
        };

        $scope.setPosition = function(position) {
            var pos = JSON.parse(position);
            $scope.$apply(function() {
                for (var key in $scope.position) {
                    $scope.position[key] = (key === pos.v || key === pos.h);
                }
                $scope.showIcon = true;
            });
        };

        $scope.setShortcuts = function(shortcuts) {
            var s = JSON.parse(shortcuts);
            $scope.$apply(function() {
                $scope.shortcuts = s;
            });
        };

        chrome.storage.local.get('position', function(items) {
            if (items.position) {
                $scope.setPosition(items.position);
            }
        });
        chrome.storage.local.get('shortcuts', function(items) {
            if (items.shortcuts) {
                $scope.setShortcuts(items.shortcuts);
            }
        });

        chrome.storage.onChanged.addListener(function(changes, areaName) {
            if (changes.position) {
                $scope.setPosition(changes.position.newValue);
            }
            if (changes.shortcuts) {
                $scope.setShortcuts(changes.shortcuts.newValue);
            }
        });

        $scope.hideShortcuts = function() {
            $(window).off('click.bgt-shortcut-holder');
            $scope.showHolder = false;
        };
        $scope.showShortcuts = function($event) {
            $event.stopPropagation();
            $scope.showHolder = true;
            $(window).on('click.bgt-shortcut-holder', function() {
                $scope.$apply($scope.hideShortcuts);
            });
        };

        $scope.refresh = function($event) {
            $event.stopPropagation();
            $(window).trigger('shRefreshPage');
        };
        $scope.shortcutClick = function(shortcut) {
            $(window).trigger('shortcutClick', shortcut);
            $scope.hideShortcuts();
        };
    });

angular.module('shortcutsApp').run(function($templateCache) {
    $templateCache.put('shortcuts.html', "<div s-toggle=\"showIcon\" data-ng-click=\"showShortcuts($event)\" class=\"bgt bgt-shortcuts-icon\" style=\"display: none;\"data-ng-class=\"{ 'top': position.top, 'middle': position.middle, 'bottom': position.bottom, 'left': position.left, 'center': position.center, 'right': position.right }\">Shortcuts&nbsp;<span data-ng-click=\"refresh($event)\" data-ng-show=\"showRefresh\" class=\"ui-state-default ui-corner-all refreshBtn\"><span class=\"ui-icon ui-icon-refresh\"></span></span></div><div data-ng-click=\"$event.stopPropagation()\" s-toggle=\"showHolder\" class=\"bgt bgt-shortcut-holder\" style=\"display: none;\"data-ng-class=\"{ 'top': position.top, 'middle': position.middle, 'bottom': position.bottom, 'left': position.left, 'center': position.center, 'right': position.right }\"><span data-ng-click=\"hideShortcuts()\" class=\"bgt-shortcuts-close-icon\">Close</span><span class=\"bgt-shortcut\" data-ng-repeat=\"shortcut in shortcuts\">[<a data-ng-click=\"shortcutClick(shortcut)\">{{shortcut.Name}}</a>]<br /></span></div>");
});
