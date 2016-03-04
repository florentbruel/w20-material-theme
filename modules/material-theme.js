define([
    'require',
    'module',

    '{lodash}/lodash',
    '{angular}/angular',

    '[text]!{w20-material-theme}/templates/topbar.html',
    '[text]!{w20-material-theme}/templates/sidenav.html',

    '{w20-material-theme}/modules/services/route-service',

    '{w20-core}/modules/culture',
    '{w20-core}/modules/utils',

], function(require, module, _, angular, topbarTemplate, sidenavTemplate) {
    'use strict';

    var _config = module && module.config() || {},
        w20MaterialTheme = angular.module('w20MaterialTheme', ['ngMaterial','w20CoreCulture', 'w20CoreUtils', 'ngSanitize', 'ngAnimate']);
    
    w20MaterialTheme.config(['$ariaProvider', '$mdThemingProvider', function($ariaProvider, $mdThemingProvider) {
        $ariaProvider.config({
            tabindex: false
        });
        $mdThemingProvider.theme('default')
            .primaryPalette(_config.palette.primary)
            .accentPalette(_config.palette.secondary);
    }]);

    w20MaterialTheme.directive('w20MaterialTopbar', ['$rootScope', '$route', 'EventService', 'DisplayService', 'MenuService', 'EnvironmentService', 'ApplicationService', 'SecurityExpressionService', 'CultureService', '$timeout', '$window', '$document', '$log', '$mdUtil', '$animate',
        function($rootScope, $route, eventService, displayService, menuService, environmentService, applicationService, securityExpressionService, cultureService, $timeout, $window, $document, $log, $mdUtil, $animate) {
            return {
                template: topbarTemplate,
                transclude: true,
                restrict: 'A',
                scope: true,
                link: link
            };

            function link(scope, iElement, iAttrs) {
                scope.topbar = {
                    title: ""
                };

                scope.displayName = cultureService.displayName;
                
                scope.search = {
                    opened: false,
                    value: "",
                    unwatch: undefined,
                    backdrop: $mdUtil.createBackdrop(scope, "md-opaque md-menu-backdrop ng-enter"),
                    style: {},
                    open: function() {
                        scope.search.opened = true;
                        scope.search.focus();

                        scope.search.unwatch = scope.$watch("search.value", function(value) {
                            $rootScope.$broadcast("search.query", value);
                        });
                        
                        scope.search.style = {
                            'z-index': 100 //Watch for md-backdrop.md-menu-backdrop rule in angular-material.css, then add 1
                        };
                        
                        $animate.enter(scope.search.backdrop, $document.context.body);
                    },
                    close: function() {
                        scope.search.opened = false;
                        scope.search.unwatch();
                        $animate.leave(scope.search.backdrop).then(function() {
                            scope.search.style = {};
                        });
                    },
                    focus: function() {
                        $timeout(function() {
                            $window.document.querySelector("md-toolbar [name=reference-search]").focus();
                        });
                    }
                };

                scope.search.backdrop[0].addEventListener('click', function() {
                    scope.$applyAsync(scope.search.close);
                });

                scope.unregister = {
                    "$routeChangeSuccess" : $rootScope.$on('$routeChangeSuccess', function(event, route) {
                        scope.topbar.title = cultureService.localize(route.$$route.i18n + ".title");
                    })
                }

                scope.$on('$destroy', function(event) {
                    scope.unregister.forEach(function(fn) {fn()});
                });
            }
        }
    ]);

    w20MaterialTheme.directive('w20MaterialSidenav', ['$rootScope', 'CultureService', 'AuthenticationService', 'RouteService', '$log', '$mdSidenav', '$location', '$route',
        function($rootScope, cultureService, authenticationService, routeService, $log, $mdSidenav, $location, $route) {

            return {
                template: sidenavTemplate,
                replace: true,
                transclude: true,
                restrict: 'A',
                scope: true,
                link: link
            };

            function link(scope, iElement, iAttrs) {
                scope.sidenav = {
                    logoUrl: _config.logoUrl,
                    logoImg: _config.logoImg,
                    backgroundImg: _config.backgroundImg,
                    user: "",
                    routes: routeService.topLevelRoutes()
                };

                scope.displayName = cultureService.displayName;
                
                scope.goTo = function(path, $event) {
                    $location.path(path);
                    $mdSidenav('left').close();
                };

                scope.unregister = {
                    "w20.security.authenticated": $rootScope.$on('w20.security.authenticated',function(){
                        scope.userFullName = authenticationService.subjectPrincipals().fullName;
                    }),
                    "sidenav.open": $rootScope.$on("sidenav.open", function(event, val) {
                        val = !angular.isDefined(val) ? 'toggle': val ? 'open': 'close';
                        $mdSidenav('left')[val]();
                    })
                }
                
                scope.$on('$destroy', function(event) {
                    scope.unregister.forEach(function(fn) {fn()});
                });
            };
        }
    ]);

    return {
        angularModules: ['w20MaterialTheme'],
        lifecycle: {}
    };
});
