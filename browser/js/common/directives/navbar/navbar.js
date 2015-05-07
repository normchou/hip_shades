'use strict';
app.directive('navbar', function ($rootScope, AuthService, AUTH_EVENTS, $state) {

    // Make sure to run gulp throughout dev, and change the products state
    // When products are available.

    return {
        restrict: 'E',
        scope: {},
        templateUrl: 'js/common/directives/navbar/navbar.html',
        link: function (scope) {
            scope.items = [
                { label: 'Home', state: 'home' },
                { label: 'Products', state: 'products' },
                { label: 'Cart', state: 'cart'},
                { label: 'Member Management', state: 'membersOnly', auth: true},
            ];
            scope.items2 = [
                { label: 'Product Management', state: 'productMgt', admin: true},
                { label: 'Order Management', state: 'orderMgt', admin: true},
                { label: 'User Management', state: 'userMgt', admin: true}
            ];

            scope.user = null;
            scope.criteriaObject = {}
            
            scope.isLoggedIn = function () {
                return AuthService.isAuthenticated();
            };

			scope.isAdmin = function() {
				return AuthService.isAdmin();
			};

            scope.logout = function () {
                AuthService.logout().then(function () {
                   $state.go('home');
                });
            };

            scope.search = function (title) {
                $state.go('search');
                
            };
            
            var setUser = function () {
                AuthService.getLoggedInUser().then(function (user) {
                    scope.user = user;
                });
            };
            
            var removeUser = function () {
                scope.user = null;
            };

            
            setUser();
            
            $rootScope.$on(AUTH_EVENTS.loginSuccess, setUser);
            $rootScope.$on(AUTH_EVENTS.logoutSuccess, removeUser);
            $rootScope.$on(AUTH_EVENTS.sessionTimeout, removeUser);

        }

    };

});
