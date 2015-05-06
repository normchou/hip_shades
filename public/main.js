'use strict';
var app = angular.module('FullstackGeneratedApp', ['ui.router', 'fsaPreBuilt']);

app.config(function ($urlRouterProvider, $locationProvider) {
    // This turns off hashbang urls (/#about) and changes it to something normal (/about)
    $locationProvider.html5Mode(true);
    // If we go to a URL that ui-router doesn't have registered, go to the "/" url.
    $urlRouterProvider.otherwise('/');
});

// This app.run is for controlling access to specific states.
app.run(function ($rootScope, AuthService, $state) {

    // The given state requires an authenticated user.
    var destinationStateRequiresAuth = function destinationStateRequiresAuth(state) {
        return state.data && state.data.authenticate;
    };

    // $stateChangeStart is an event fired
    // whenever the process of changing a state begins.
    $rootScope.$on('$stateChangeStart', function (event, toState, toParams) {

        if (!destinationStateRequiresAuth(toState)) {
            // The destination state does not require authentication
            // Short circuit with return.
            return;
        }

        if (AuthService.isAuthenticated()) {
            // The user is authenticated.
            // Short circuit with return.
            return;
        }

        // Cancel navigating to new state.
        event.preventDefault();

        AuthService.getLoggedInUser().then(function (user) {
            // If a user is retrieved, then renavigate to the destination
            // (the second time, AuthService.isAuthenticated() will work)
            // otherwise, if no user is logged in, go to "login" state.
            if (user) {
                $state.go(toState.name, toParams);
            } else {
                $state.go('login');
            }
        });
    });
});
app.factory('CartFactory', function ($http) {

    return {

        getCurrentUser: function getCurrentUser() {
            // temporary user workflow
            // get current user from cookie id
            return $http.get('/api/users/currentuser/').then(function (res) {
                if (res.data) return res.data[0];
                throw err;
            })['catch'](function (err) {
                console.error(err);
                return err;
            });
        },

        deleteProductInCart: function deleteProductInCart(userID, orderID, productID) {
            return $http['delete']('/api/users/' + userID + '/orders/' + orderID + '/products/' + productID).then(function (res) {
                return res.data;
            })['catch'](function (err) {
                console.error(err);
                return err;
            });
        },

        priceSum: function priceSum(currentOrder) {
            var total = 0;

            currentOrder.products.forEach(function (elem) {
                total += elem.id.price * elem.quantity;
            });

            return total;
        },

        itemCount: function itemCount(currentOrder) {
            var total = 0;

            currentOrder.products.forEach(function (elem) {
                total += elem.quantity;
            });

            return total;
        },

        saveOrder: function saveOrder(userID, orderID, currentOrder) {
            return $http.post('/api/users/' + userID + '/orders/' + orderID, currentOrder).then(function (res) {
                return res.data;
            })['catch'](function (err) {
                console.error(err);
                return err;
            });
        }

    };
});
'use strict';

//The Config below defines the /cart state, which will
//show all products in the cart.

app.config(function ($stateProvider) {
    $stateProvider.state('cart', {
        url: '/cart',
        templateUrl: 'js/cart/cart.html',
        controller: 'CartController'
    });
});

app.controller('CartController', function ($scope, CartFactory) {
    // temporary user workflow
    // get current user from cookie id
    $scope.quantities = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    $scope.initializeCart = function () {
        CartFactory.getCurrentUser().then(function (currentOrder) {

            if (currentOrder === 'undefined') {
                console.log('nothing in cart');
            } else {
                $scope.defineCartScope(currentOrder);
            }
        })['catch'](function (err) {
            console.error(err);
            return err;
        });
    };

    $scope.deleteProduct = function (product) {
        //DELETE /api/users/:userid/orders/:anorderid/products/:aproductID
        CartFactory.deleteProductInCart($scope.currentOrder.user_id, $scope.currentOrder._id, product.id._id).then(function (newCurrentOrder) {
            $scope.defineCartScope(newCurrentOrder);
        })['catch'](function (err) {
            console.error(err);
            return err;
        });
    };

    $scope.saveQuantity = function () {
        CartFactory.saveOrder($scope.currentOrder.user_id, $scope.currentOrder._id, $scope.currentOrder).then(function (newCurrentOrder) {
            $scope.defineCartScope(newCurrentOrder);
        })['catch'](function (err) {
            console.error(err);
            return err;
        });
    };

    $scope.defineCartScope = function (currentOrder) {
        $scope.orderData = currentOrder.products;
        $scope.currentOrder = currentOrder;
        $scope.priceSum = CartFactory.priceSum(currentOrder);
        $scope.itemCount = CartFactory.itemCount(currentOrder);
        $scope.salesTax = $scope.priceSum > 0 ? 28.5 : 0;
        $scope.shippingHandling = $scope.priceSum > 0 ? 20 : 0;
        $scope.totalOrder = $scope.priceSum + $scope.salesTax + $scope.shippingHandling;
    };

    $scope.initializeCart();
});
'use strict';
app.config(function ($stateProvider) {
    $stateProvider.state('home', {
        url: '/',
        templateUrl: 'js/home/home.html' });
});

app.config(function ($stateProvider) {

    $stateProvider.state('login', {
        url: '/login',
        templateUrl: 'js/login/login.html',
        controller: 'LoginCtrl'
    });
});

app.controller('LoginCtrl', function ($scope, AuthService, $state) {

    $scope.login = {};
    $scope.error = null;

    $scope.sendLogin = function (loginInfo) {

        $scope.error = null;

        AuthService.login(loginInfo).then(function () {
            $state.go('home');
        })['catch'](function () {
            $scope.error = 'Invalid login credentials.';
        });
    };
});
app.config(function ($stateProvider) {

    $stateProvider.state('membersOnly', {
        url: '/members-area',
        templateUrl: 'js/members-only/members-only.html',
        controller: 'MemberController',
        resolve: {
            orders: function orders(Orders) {
                return Orders.getAllOrders();
            }
        },
        // The following data.authenticate is read by an event listener
        // that controls access to this state. Refer to app.js.
        data: {
            authenticate: true
        }
    });
});

app.controller('MemberController', function ($scope, $http, SecretStash, orders, AuthService) {

    console.log('member controller hit');

    SecretStash.getStash().then(function (stash) {
        $scope.stash = stash;
    });

    $scope.order = orders;

    console.log('calling controller', AuthService.getLoggedInUser().then(function (data) {
        return data;
    }));
});

app.factory('SecretStash', function ($http) {

    var getStash = function getStash() {
        return $http.get('/api/members/secret-stash').then(function (response) {
            return response.data;
        });
    };

    return {
        getStash: getStash
    };
});
(function () {

    'use strict';

    // Hope you didn't forget Angular! Duh-doy.
    if (!window.angular) throw new Error('I can\'t find Angular!');

    var app = angular.module('fsaPreBuilt', []);

    app.factory('Socket', function ($location) {

        if (!window.io) throw new Error('socket.io not found!');

        var socket;

        if ($location.$$port) {
            socket = io('http://localhost:1337');
        } else {
            socket = io('/');
        }

        return socket;
    });

    // AUTH_EVENTS is used throughout our app to
    // broadcast and listen from and to the $rootScope
    // for important events about authentication flow.
    app.constant('AUTH_EVENTS', {
        loginSuccess: 'auth-login-success',
        loginFailed: 'auth-login-failed',
        logoutSuccess: 'auth-logout-success',
        sessionTimeout: 'auth-session-timeout',
        notAuthenticated: 'auth-not-authenticated',
        notAuthorized: 'auth-not-authorized'
    });

    app.factory('AuthInterceptor', function ($rootScope, $q, AUTH_EVENTS) {
        var statusDict = {
            401: AUTH_EVENTS.notAuthenticated,
            403: AUTH_EVENTS.notAuthorized,
            419: AUTH_EVENTS.sessionTimeout,
            440: AUTH_EVENTS.sessionTimeout
        };
        return {
            responseError: function responseError(response) {
                $rootScope.$broadcast(statusDict[response.status], response);
                return $q.reject(response);
            }
        };
    });

    app.config(function ($httpProvider) {
        $httpProvider.interceptors.push(['$injector', function ($injector) {
            return $injector.get('AuthInterceptor');
        }]);
    });

    app.service('AuthService', function ($http, Session, $rootScope, AUTH_EVENTS, $q) {

        // Uses the session factory to see if an
        // authenticated user is currently registered.
        this.isAuthenticated = function () {
            return !!Session.user;
        };

        this.getLoggedInUser = function () {
            // If an authenticated session exists, we
            // return the user attached to that session
            // with a promise. This ensures that we can
            // always interface with this method asynchronously.
            if (this.isAuthenticated()) {
                return $q.when(Session.user);
            }

            // Make request GET /session.
            // If it returns a user, call onSuccessfulLogin with the response.
            // If it returns a 401 response, we catch it and instead resolve to null.
            return $http.get('/session').then(onSuccessfulLogin)['catch'](function () {
                return null;
            });
        };

        this.isAdmin = function () {
            if (this.isAuthenticated()) return !!Session.user.admin;else return false;
        };

        this.login = function (credentials) {
            return $http.post('/login', credentials).then(onSuccessfulLogin)['catch'](function (response) {
                return $q.reject({ message: 'Invalid login credentials.' });
            });
        };

        this.logout = function () {
            return $http.get('/logout').then(function () {
                Session.destroy();
                $rootScope.$broadcast(AUTH_EVENTS.logoutSuccess);
            });
        };

        function onSuccessfulLogin(response) {
            var data = response.data;
            Session.create(data.id, data.user);
            $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
            return data.user;
        };
    });

    app.service('Session', function ($rootScope, AUTH_EVENTS) {

        var self = this;

        $rootScope.$on(AUTH_EVENTS.notAuthenticated, function () {
            self.destroy();
        });

        $rootScope.$on(AUTH_EVENTS.sessionTimeout, function () {
            self.destroy();
        });

        this.id = null;
        this.user = null;

        this.create = function (sessionId, user) {
            this.id = sessionId;
            this.user = user;
        };

        this.destroy = function () {
            this.id = null;
            this.user = null;
        };
    });
})();

'use strict';

app.config(function ($stateProvider) {
    $stateProvider.state('orderMgt', {
        url: '/orderManagement',
        templateUrl: 'js/order-management/order-management.html',
        controller: 'OrderManagementController',
        resolve: {
            orders: function orders(Orders) {
                return Orders.getAllOrders();
            },
            deleteOrder: function deleteOrder(Orders) {
                return Orders.deleteOrder;
            }
        }
    }).state('orderMgt.edit', {
        url: '/:orderID',
        templateUrl: 'js/order-manangement/order-management-edit.html',
        controller: 'OrderManagementController'
    });
});

app.controller('OrderManagementController', function ($scope, AuthService, $stateParams, $http, orders, deleteOrder) {
    $scope.orders = orders;

    $scope.deleteOrder = function (orderID) {
        // Delete the order from the database
        deleteOrder(orderID);

        $scope.orders.forEach(function (order, idx) {
            if (order._id === orderID) {
                return $scope.orders.splice(idx, 1);
            }
        });
    };
});

'use strict';
app.config(function ($stateProvider) {
    $stateProvider.state('productMgt', {
        url: '/productManagement/',
        templateUrl: 'js/product-management/product-management.html',
        controller: 'ProductManagementController'
    }).state('productMgt.edit', {
        url: '/:productID',
        templateUrl: 'js/product-management/product-management-edit.html',
        controller: 'ProductManagementController'
    });
});

app.controller('ProductManagementController', function ($scope, $stateParams, $http) {

    $http.get('/api/products').then(function (response) {
        $scope.products = response.data;
        return $scope.products;
    });

    if ($stateParams.productID) {
        $http.get('/api/products/' + $stateParams.productID).then(function (response) {
            $scope.productItem = response.data;
        });
    }

    // this function is used when saving edits to existing products -NC 5/2/15
    $scope.saveProduct = function () {
        // console.log('this is root scope', $rootScope.productItem)

        // $rootScope.products.push($scope.productItem)
        console.log('yooooooo');
    };

    // removes a product -NC 5/2/15
    $scope.removeProduct = function (product) {
        $scope.products.forEach(function (scopeProduct) {
            if (product._id === scopeProduct._id) {
                var index = $scope.products.indexOf(scopeProduct);
                return $scope.products.splice(index, 1);
            }
        });

        $http['delete']('/api/products/' + product._id).then(function (response) {
            console.log(response.data);
        });
    };
});

'use strict';
app.config(function ($stateProvider) {
    $stateProvider.state('products', {
        url: '/products',
        templateUrl: 'js/products/products.html',
        controller: 'ProductsController'
    }).state('products.item', {
        url: '/:productID',
        templateUrl: 'js/products/productItem.html',
        controller: 'ProductsController'
    }).state('products.categories', {
        url: '/:productCategory',
        templateUrl: 'js/products/productCategory.html',
        controller: 'ProductsController'
    });
});

app.controller('ProductsController', function ($scope, $stateParams, $http) {

    // request to get list of products - NC 4/26/2015
    $http.get('/api/products').then(function (response) {
        $scope.products = response.data;
        return $scope.products;
    });

    $scope.genders = ['women', 'men'];
    $scope.brands = ['Oakley', 'Prada', 'Ray-Ban'];

    if ($stateParams.productCategory) {
        // request to get list of categories - NC 4/26/2015
        $http.get('/api/categories/' + $stateParams.productCategory).then(function (response) {
            $scope.productCategory = response.data;
        });
    }

    if ($stateParams.productID) {
        // request to get product reviews - NC 4/26/2015
        $http.get('/api/products/' + $stateParams.productID + '/reviews').then(function (response) {
            $scope.productReviews = response.data;
        });
        // request to get single product - NC 4/26/2015
        $http.get('/api/products/' + $stateParams.productID).then(function (response) {
            $scope.productItem = response.data;
        });
    }

    // console.log('this is the logged in user', AuthService.getLoggedInUser())

    // function to add an order to database - NC 4/26/2015
    $scope.createOrder = function (id) {
        // AuthService.getLoggedInUser().then(function(data) {console.log(data._id)})  // this gives me the logged in user
        $http.post('/api/products/' + id).then(function (response) {
            console.log('successfully posted', response.data);
        });
    };

    $scope.reviewItem = {
        user_id: null,
        product_id: $stateParams.productID,
        stars: 0,
        review: ''
    };

    $scope.showReviewForm = false;

    $scope.$watch('showReviewForm', function () {
        $scope.addReviewButtonText = $scope.showReviewForm ? 'Hide Form' : 'Add Review';
    });

    $scope.submitReview = function (review) {

        $http.post('/api/products/' + $stateParams.productID + '/reviews', review).then(function (response) {
            console.log(response.data);
        });

        $scope.reviewItem = {
            user_id: null,
            product_id: $stateParams.productID,
            stars: 0,
            review: ''
        };

        $scope.showReviewForm = false;
    };
});

app.factory('SignUpFactory', function ($http) {

    return {

        signupNewUser: function signupNewUser(signupObject) {
            return $http.post('/api/users', signupObject).then(function (response) {
                return response.data;
            })['catch'](function (err) {
                console.error(err);
                return err;
            });
        }

    };
});
app.config(function ($stateProvider) {
    $stateProvider.state('signup', {
        url: '/signup',
        templateUrl: 'js/signup/signup.html',
        controller: 'SignUpCtrl'
    });
});

app.controller('SignUpCtrl', function ($scope, AuthService, $state, SignUpFactory) {

    $scope.error = null;
    $scope.signup = {};

    $scope.sendSignup = function (signup) {
        $scope.error = null;

        SignUpFactory.signupNewUser(signup).then(function (user) {
            $state.go('home');
            return AuthService.getLoggedInUser();
        })['catch'](function (err) {
            $scope.error = 'Sign up form not completed/filled correctly!';
            console.error(err);
        });
    };
});
'use strict';
app.config(function ($stateProvider) {
    $stateProvider.state('userMgt', {
        url: '/userManagement',
        templateUrl: 'js/user-management/user-management.html',
        controller: 'UserManagementController'
    }).state('userMgt.edit', {
        url: '/:userID',
        templateUrl: 'js/user-management/user-management-edit.html',
        controller: 'UserManagementController'
    });
});

app.controller('UserManagementController', function ($scope, $stateParams, $http) {

    $http.get('/api/users').then(function (response) {
        $scope.users = response.data;
    });

    if (!!$stateParams.userID) {
        $http.get('/api/users/' + $stateParams.userID).then(function (response) {
            $scope.userItem = response.data;
        });
    }

    // this function is used when saving edits to existing users -NC 5/2/15
    $scope.saveUser = function () {
        $http.put('/api/users', $scope.userItem).then(function (response) {
            console.log(response.data);
        });
    };

    // removes a user -NC 5/2/15
    $scope.removeUser = function (user) {
        $scope.users.forEach(function (scopeUser) {
            if (user._id === scopeUser._id) {
                var index = $scope.users.indexOf(scopeUser);
                return $scope.users.splice(index, 1);
            }
        });

        $http['delete']('/api/users/' + user._id).then(function (response) {
            console.log(response.data);
        });
    };
});

'use strict';
app.factory('RandomGreetings', function () {

    var getRandomFromArray = function getRandomFromArray(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    };

    var greetings = ['Hello, world!', 'At long last, I live!', 'Hello, simple human.', 'What a beautiful day!', 'I\'m like any other project, except that I am yours. :)', 'This empty string is for Lindsay Levine.'];

    return {
        greetings: greetings,
        getRandomGreeting: function getRandomGreeting() {
            return getRandomFromArray(greetings);
        }
    };
});
'use strict';

'use strict';

app.factory('Orders', function (AuthService, $http) {

    // get all orders by admin
    var getAllOrders = function getAllOrders() {
        return AuthService.getLoggedInUser().then(function (data) {

            console.log('passed auth');

            var url = '/api/users/' + data._id + '/allOrders';
            return $http.get(url);
        }).then(function (response) {
            return response.data;
        });
    };

    // delete url: /api/users/_userID_/orders/_orderID_/delete
    var deleteOrder = function deleteOrder(orderID) {
        return AuthService.getLoggedInUser().then(function (data) {
            var url = '/api/users/' + data._id + '/orders/' + orderID + '/delete';
            return $http['delete'](url);
        }).then(function (res) {
            return res.data;
        })['catch'](function (err) {
            console.log(err);
            return err;
        });
    };

    return {
        getAllOrders: getAllOrders,
        deleteOrder: deleteOrder
    };
});

'use strict';

app.factory('Users', function (AuthService, $http) {

    var getAllUsers = function getAllUsers() {
        return AuthService.getLoggedInUser().then(function (data) {
            var url = '/api/users/';
            console.log(url);
            return $http.get(url);
        }).then(function (response) {
            return response.data;
        });
    };

    return {
        getAllUsers: getAllUsers
    };
});

// unable to get this work at the moment - NC 4/26/2015

'use strict';
app.directive('hipshadesLogo', function () {
    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/hipshades-logo/hipshades-logo.html'
    };
});
'use strict';
app.directive('navbar', function ($rootScope, AuthService, AUTH_EVENTS, $state) {

    // Make sure to run gulp throughout dev, and change the products state
    // When products are available.

    return {
        restrict: 'E',
        scope: {},
        templateUrl: 'js/common/directives/navbar/navbar.html',
        link: function link(scope) {
            scope.items = [{ label: 'Home', state: 'home' }, { label: 'Products', state: 'products' }, { label: 'Cart', state: 'cart' }, { label: 'Member Management', state: 'membersOnly', auth: true }];
            scope.items2 = [{ label: 'Product Management', state: 'productMgt', admin: true }, { label: 'Order Management', state: 'orderMgt', admin: true }, { label: 'User Management', state: 'userMgt', admin: true }];

            scope.user = null;

            scope.isLoggedIn = function () {
                return AuthService.isAuthenticated();
            };

            scope.isAdmin = function () {
                return AuthService.isAdmin();
            };

            scope.logout = function () {
                AuthService.logout().then(function () {
                    $state.go('home');
                });
            };

            var setUser = function setUser() {
                AuthService.getLoggedInUser().then(function (user) {
                    scope.user = user;
                });
            };

            var removeUser = function removeUser() {
                scope.user = null;
            };

            setUser();

            $rootScope.$on(AUTH_EVENTS.loginSuccess, setUser);
            $rootScope.$on(AUTH_EVENTS.logoutSuccess, removeUser);
            $rootScope.$on(AUTH_EVENTS.sessionTimeout, removeUser);
        }

    };
});
// $http.get('/session', function(err, data) {
//    if (err) return console.log(err);
//    console.log('this is the data', data)
// }
// authservice for localhost:1337/session

// $http.put('/api/products', $scope.productItem)
// 	.then(function (response) {
// 		console.log(response.data);
// 	})
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNhcnQvQ2FydEZhY3RvcnkuanMiLCJjYXJ0L2NhcnQuanMiLCJob21lL2hvbWUuanMiLCJsb2dpbi9sb2dpbi5qcyIsIm1lbWJlcnMtb25seS9tZW1iZXJzLW9ubHkuanMiLCJmc2EvZnNhLXByZS1idWlsdC5qcyIsIm9yZGVyLW1hbmFnZW1lbnQvb3JkZXItbWFuYWdlbWVudC5qcyIsInByb2R1Y3QtbWFuYWdlbWVudC9wcm9kdWN0LW1hbmFnZW1lbnQuanMiLCJwcm9kdWN0cy9wcm9kdWN0cy5qcyIsInNpZ251cC9TaWdudXBGYWN0b3J5LmpzIiwic2lnbnVwL3NpZ251cC5qcyIsInVzZXItbWFuYWdlbWVudC91c2VyLW1hbmFnZW1lbnQuanMiLCJjb21tb24vZmFjdG9yaWVzL1JhbmRvbUdyZWV0aW5ncy5qcyIsImNvbW1vbi9mYWN0b3JpZXMvU29ja2V0LmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9nZXRPcmRlcnMuanMiLCJjb21tb24vZmFjdG9yaWVzL2dldFVzZXJEYXRhLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvaGlwc2hhZGVzLWxvZ28vaGlwc2hhZGVzLWxvZ28uanMiLCJjb21tb24vZGlyZWN0aXZlcy9uYXZiYXIvbmF2YmFyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQUEsQ0FBQTtBQUNBLElBQUEsR0FBQSxHQUFBLE9BQUEsQ0FBQSxNQUFBLENBQUEsdUJBQUEsRUFBQSxDQUFBLFdBQUEsRUFBQSxhQUFBLENBQUEsQ0FBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxrQkFBQSxFQUFBLGlCQUFBLEVBQUE7O0FBRUEscUJBQUEsQ0FBQSxTQUFBLENBQUEsSUFBQSxDQUFBLENBQUE7O0FBRUEsc0JBQUEsQ0FBQSxTQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7Q0FDQSxDQUFBLENBQUE7OztBQUlBLEdBQUEsQ0FBQSxHQUFBLENBQUEsVUFBQSxVQUFBLEVBQUEsV0FBQSxFQUFBLE1BQUEsRUFBQTs7O0FBR0EsUUFBQSw0QkFBQSxHQUFBLHNDQUFBLEtBQUEsRUFBQTtBQUNBLGVBQUEsS0FBQSxDQUFBLElBQUEsSUFBQSxLQUFBLENBQUEsSUFBQSxDQUFBLFlBQUEsQ0FBQTtLQUNBLENBQUE7Ozs7QUFJQSxjQUFBLENBQUEsR0FBQSxDQUFBLG1CQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUEsT0FBQSxFQUFBLFFBQUEsRUFBQTs7QUFFQSxZQUFBLENBQUEsNEJBQUEsQ0FBQSxPQUFBLENBQUEsRUFBQTs7O0FBR0EsbUJBQUE7U0FDQTs7QUFFQSxZQUFBLFdBQUEsQ0FBQSxlQUFBLEVBQUEsRUFBQTs7O0FBR0EsbUJBQUE7U0FDQTs7O0FBR0EsYUFBQSxDQUFBLGNBQUEsRUFBQSxDQUFBOztBQUVBLG1CQUFBLENBQUEsZUFBQSxFQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsSUFBQSxFQUFBOzs7O0FBSUEsZ0JBQUEsSUFBQSxFQUFBO0FBQ0Esc0JBQUEsQ0FBQSxFQUFBLENBQUEsT0FBQSxDQUFBLElBQUEsRUFBQSxRQUFBLENBQUEsQ0FBQTthQUNBLE1BQUE7QUFDQSxzQkFBQSxDQUFBLEVBQUEsQ0FBQSxPQUFBLENBQUEsQ0FBQTthQUNBO1NBQ0EsQ0FBQSxDQUFBO0tBRUEsQ0FBQSxDQUFBO0NBRUEsQ0FBQSxDQUFBO0FDbkRBLEdBQUEsQ0FBQSxPQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBOztBQUVBLFdBQUE7O0FBRUEsc0JBQUEsRUFBQSwwQkFBQTs7O0FBR0EsbUJBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSx5QkFBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0Esb0JBQUEsR0FBQSxDQUFBLElBQUEsRUFDQSxPQUFBLEdBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQSxDQUFBLENBQUE7QUFDQSxzQkFBQSxHQUFBLENBQUE7YUFDQSxDQUFBLFNBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLHVCQUFBLENBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBO0FBQ0EsdUJBQUEsR0FBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7O0FBRUEsMkJBQUEsRUFBQSw2QkFBQSxNQUFBLEVBQUEsT0FBQSxFQUFBLFNBQUEsRUFBQTtBQUNBLG1CQUFBLEtBQUEsVUFBQSxDQUFBLGFBQUEsR0FBQSxNQUFBLEdBQUEsVUFBQSxHQUFBLE9BQUEsR0FBQSxZQUFBLEdBQUEsU0FBQSxDQUFBLENBQ0EsSUFBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsdUJBQUEsR0FBQSxDQUFBLElBQUEsQ0FBQTthQUNBLENBQUEsU0FBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsdUJBQUEsQ0FBQSxLQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7QUFDQSx1QkFBQSxHQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FFQTs7QUFFQSxnQkFBQSxFQUFBLGtCQUFBLFlBQUEsRUFBQTtBQUNBLGdCQUFBLEtBQUEsR0FBQSxDQUFBLENBQUE7O0FBRUEsd0JBQUEsQ0FBQSxRQUFBLENBQUEsT0FBQSxDQUFBLFVBQUEsSUFBQSxFQUFBO0FBQ0EscUJBQUEsSUFBQSxJQUFBLENBQUEsRUFBQSxDQUFBLEtBQUEsR0FBQSxJQUFBLENBQUEsUUFBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBOztBQUVBLG1CQUFBLEtBQUEsQ0FBQTtTQUNBOztBQUVBLGlCQUFBLEVBQUEsbUJBQUEsWUFBQSxFQUFBO0FBQ0EsZ0JBQUEsS0FBQSxHQUFBLENBQUEsQ0FBQTs7QUFFQSx3QkFBQSxDQUFBLFFBQUEsQ0FBQSxPQUFBLENBQUEsVUFBQSxJQUFBLEVBQUE7QUFDQSxxQkFBQSxJQUFBLElBQUEsQ0FBQSxRQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7O0FBRUEsbUJBQUEsS0FBQSxDQUFBO1NBQ0E7O0FBRUEsaUJBQUEsRUFBQSxtQkFBQSxNQUFBLEVBQUEsT0FBQSxFQUFBLFlBQUEsRUFBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxJQUFBLENBQUEsYUFBQSxHQUFBLE1BQUEsR0FBQSxVQUFBLEdBQUEsT0FBQSxFQUFBLFlBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLHVCQUFBLEdBQUEsQ0FBQSxJQUFBLENBQUE7YUFDQSxDQUFBLFNBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLHVCQUFBLENBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBO0FBQ0EsdUJBQUEsR0FBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7O0tBRUEsQ0FBQTtDQUVBLENBQUEsQ0FBQTtBQzNEQSxZQUFBLENBQUE7Ozs7O0FBS0EsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTtBQUNBLGtCQUFBLENBQ0EsS0FBQSxDQUFBLE1BQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxPQUFBO0FBQ0EsbUJBQUEsRUFBQSxtQkFBQTtBQUNBLGtCQUFBLEVBQUEsZ0JBQUE7S0FDQSxDQUFBLENBQUE7Q0FDQSxDQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFVBQUEsQ0FBQSxnQkFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLFdBQUEsRUFBQTs7O0FBR0EsVUFBQSxDQUFBLFVBQUEsR0FBQSxDQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQSxDQUFBLENBQUE7O0FBRUEsVUFBQSxDQUFBLGNBQUEsR0FBQSxZQUFBO0FBQ0EsbUJBQUEsQ0FBQSxjQUFBLEVBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxZQUFBLEVBQUE7O0FBRUEsZ0JBQUEsWUFBQSxLQUFBLFdBQUEsRUFBQTtBQUNBLHVCQUFBLENBQUEsR0FBQSxDQUFBLGlCQUFBLENBQUEsQ0FBQTthQUNBLE1BQUE7QUFDQSxzQkFBQSxDQUFBLGVBQUEsQ0FBQSxZQUFBLENBQUEsQ0FBQTthQUNBO1NBQ0EsQ0FBQSxTQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSxtQkFBQSxDQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQTtBQUNBLG1CQUFBLEdBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLGFBQUEsR0FBQSxVQUFBLE9BQUEsRUFBQTs7QUFFQSxtQkFBQSxDQUFBLG1CQUFBLENBQUEsTUFBQSxDQUFBLFlBQUEsQ0FBQSxPQUFBLEVBQUEsTUFBQSxDQUFBLFlBQUEsQ0FBQSxHQUFBLEVBQUEsT0FBQSxDQUFBLEVBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxlQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLGVBQUEsQ0FBQSxlQUFBLENBQUEsQ0FBQTtTQUNBLENBQUEsU0FBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsbUJBQUEsQ0FBQSxLQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7QUFDQSxtQkFBQSxHQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxZQUFBLEdBQUEsWUFBQTtBQUNBLG1CQUFBLENBQUEsU0FBQSxDQUFBLE1BQUEsQ0FBQSxZQUFBLENBQUEsT0FBQSxFQUFBLE1BQUEsQ0FBQSxZQUFBLENBQUEsR0FBQSxFQUFBLE1BQUEsQ0FBQSxZQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxlQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLGVBQUEsQ0FBQSxlQUFBLENBQUEsQ0FBQTtTQUNBLENBQUEsU0FBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsbUJBQUEsQ0FBQSxLQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7QUFDQSxtQkFBQSxHQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxlQUFBLEdBQUEsVUFBQSxZQUFBLEVBQUE7QUFDQSxjQUFBLENBQUEsU0FBQSxHQUFBLFlBQUEsQ0FBQSxRQUFBLENBQUE7QUFDQSxjQUFBLENBQUEsWUFBQSxHQUFBLFlBQUEsQ0FBQTtBQUNBLGNBQUEsQ0FBQSxRQUFBLEdBQUEsV0FBQSxDQUFBLFFBQUEsQ0FBQSxZQUFBLENBQUEsQ0FBQTtBQUNBLGNBQUEsQ0FBQSxTQUFBLEdBQUEsV0FBQSxDQUFBLFNBQUEsQ0FBQSxZQUFBLENBQUEsQ0FBQTtBQUNBLGNBQUEsQ0FBQSxRQUFBLEdBQUEsTUFBQSxDQUFBLFFBQUEsR0FBQSxDQUFBLEdBQUEsSUFBQSxHQUFBLENBQUEsQ0FBQTtBQUNBLGNBQUEsQ0FBQSxnQkFBQSxHQUFBLE1BQUEsQ0FBQSxRQUFBLEdBQUEsQ0FBQSxHQUFBLEVBQUEsR0FBQSxDQUFBLENBQUE7QUFDQSxjQUFBLENBQUEsVUFBQSxHQUFBLE1BQUEsQ0FBQSxRQUFBLEdBQUEsTUFBQSxDQUFBLFFBQUEsR0FBQSxNQUFBLENBQUEsZ0JBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLGNBQUEsRUFBQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBO0FDL0RBLFlBQUEsQ0FBQTtBQUNBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUNBLEtBQUEsQ0FBQSxNQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsR0FBQTtBQUNBLG1CQUFBLEVBQUEsbUJBQUEsRUFDQSxDQUFBLENBQUE7Q0FDQSxDQUFBLENBQUE7O0FDUEEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTs7QUFFQSxrQkFBQSxDQUFBLEtBQUEsQ0FBQSxPQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsUUFBQTtBQUNBLG1CQUFBLEVBQUEscUJBQUE7QUFDQSxrQkFBQSxFQUFBLFdBQUE7S0FDQSxDQUFBLENBQUE7Q0FFQSxDQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFVBQUEsQ0FBQSxXQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsV0FBQSxFQUFBLE1BQUEsRUFBQTs7QUFFQSxVQUFBLENBQUEsS0FBQSxHQUFBLEVBQUEsQ0FBQTtBQUNBLFVBQUEsQ0FBQSxLQUFBLEdBQUEsSUFBQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxTQUFBLEdBQUEsVUFBQSxTQUFBLEVBQUE7O0FBRUEsY0FBQSxDQUFBLEtBQUEsR0FBQSxJQUFBLENBQUE7O0FBRUEsbUJBQUEsQ0FBQSxLQUFBLENBQUEsU0FBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFlBQUE7QUFDQSxrQkFBQSxDQUFBLEVBQUEsQ0FBQSxNQUFBLENBQUEsQ0FBQTtTQUNBLENBQUEsU0FBQSxDQUFBLFlBQUE7QUFDQSxrQkFBQSxDQUFBLEtBQUEsR0FBQSw0QkFBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBRUEsQ0FBQTtDQUVBLENBQUEsQ0FBQTtBQzNCQSxHQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBOztBQUVBLGtCQUFBLENBQUEsS0FBQSxDQUFBLGFBQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxlQUFBO0FBQ0EsbUJBQUEsRUFBQSxtQ0FBQTtBQUNBLGtCQUFBLEVBQUEsa0JBQUE7QUFDQSxlQUFBLEVBQUE7QUFDQSxrQkFBQSxFQUFBLGdCQUFBLE1BQUEsRUFBQTtBQUNBLHVCQUFBLE1BQUEsQ0FBQSxZQUFBLEVBQUEsQ0FBQTthQUNBO1NBQ0E7OztBQUdBLFlBQUEsRUFBQTtBQUNBLHdCQUFBLEVBQUEsSUFBQTtTQUNBO0tBQ0EsQ0FBQSxDQUFBO0NBRUEsQ0FBQSxDQUFBOztBQUdBLEdBQUEsQ0FBQSxVQUFBLENBQUEsa0JBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxLQUFBLEVBQUEsV0FBQSxFQUFBLE1BQUEsRUFBQSxXQUFBLEVBQUE7O0FBRUEsV0FBQSxDQUFBLEdBQUEsQ0FBQSx1QkFBQSxDQUFBLENBQUE7O0FBRUEsZUFBQSxDQUFBLFFBQUEsRUFBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLGNBQUEsQ0FBQSxLQUFBLEdBQUEsS0FBQSxDQUFBO0tBQ0EsQ0FBQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxLQUFBLEdBQUEsTUFBQSxDQUFBOztBQUdBLFdBQUEsQ0FBQSxHQUFBLENBQUEsb0JBQUEsRUFBQSxXQUFBLENBQUEsZUFBQSxFQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsSUFBQSxFQUFBO0FBQUEsZUFBQSxJQUFBLENBQUE7S0FBQSxDQUFBLENBQUEsQ0FBQTtDQVVBLENBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsT0FBQSxDQUFBLGFBQUEsRUFBQSxVQUFBLEtBQUEsRUFBQTs7QUFFQSxRQUFBLFFBQUEsR0FBQSxvQkFBQTtBQUNBLGVBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSwyQkFBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsbUJBQUEsUUFBQSxDQUFBLElBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsV0FBQTtBQUNBLGdCQUFBLEVBQUEsUUFBQTtLQUNBLENBQUE7Q0FFQSxDQUFBLENBQUE7QUN4REEsQ0FBQSxZQUFBOztBQUVBLGdCQUFBLENBQUE7OztBQUdBLFFBQUEsQ0FBQSxNQUFBLENBQUEsT0FBQSxFQUFBLE1BQUEsSUFBQSxLQUFBLENBQUEsd0JBQUEsQ0FBQSxDQUFBOztBQUVBLFFBQUEsR0FBQSxHQUFBLE9BQUEsQ0FBQSxNQUFBLENBQUEsYUFBQSxFQUFBLEVBQUEsQ0FBQSxDQUFBOztBQUVBLE9BQUEsQ0FBQSxPQUFBLENBQUEsUUFBQSxFQUFBLFVBQUEsU0FBQSxFQUFBOztBQUVBLFlBQUEsQ0FBQSxNQUFBLENBQUEsRUFBQSxFQUFBLE1BQUEsSUFBQSxLQUFBLENBQUEsc0JBQUEsQ0FBQSxDQUFBOztBQUVBLFlBQUEsTUFBQSxDQUFBOztBQUVBLFlBQUEsU0FBQSxDQUFBLE1BQUEsRUFBQTtBQUNBLGtCQUFBLEdBQUEsRUFBQSxDQUFBLHVCQUFBLENBQUEsQ0FBQTtTQUNBLE1BQUE7QUFDQSxrQkFBQSxHQUFBLEVBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQTtTQUNBOztBQUVBLGVBQUEsTUFBQSxDQUFBO0tBRUEsQ0FBQSxDQUFBOzs7OztBQUtBLE9BQUEsQ0FBQSxRQUFBLENBQUEsYUFBQSxFQUFBO0FBQ0Esb0JBQUEsRUFBQSxvQkFBQTtBQUNBLG1CQUFBLEVBQUEsbUJBQUE7QUFDQSxxQkFBQSxFQUFBLHFCQUFBO0FBQ0Esc0JBQUEsRUFBQSxzQkFBQTtBQUNBLHdCQUFBLEVBQUEsd0JBQUE7QUFDQSxxQkFBQSxFQUFBLHFCQUFBO0tBQ0EsQ0FBQSxDQUFBOztBQUVBLE9BQUEsQ0FBQSxPQUFBLENBQUEsaUJBQUEsRUFBQSxVQUFBLFVBQUEsRUFBQSxFQUFBLEVBQUEsV0FBQSxFQUFBO0FBQ0EsWUFBQSxVQUFBLEdBQUE7QUFDQSxlQUFBLEVBQUEsV0FBQSxDQUFBLGdCQUFBO0FBQ0EsZUFBQSxFQUFBLFdBQUEsQ0FBQSxhQUFBO0FBQ0EsZUFBQSxFQUFBLFdBQUEsQ0FBQSxjQUFBO0FBQ0EsZUFBQSxFQUFBLFdBQUEsQ0FBQSxjQUFBO1NBQ0EsQ0FBQTtBQUNBLGVBQUE7QUFDQSx5QkFBQSxFQUFBLHVCQUFBLFFBQUEsRUFBQTtBQUNBLDBCQUFBLENBQUEsVUFBQSxDQUFBLFVBQUEsQ0FBQSxRQUFBLENBQUEsTUFBQSxDQUFBLEVBQUEsUUFBQSxDQUFBLENBQUE7QUFDQSx1QkFBQSxFQUFBLENBQUEsTUFBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBO2FBQ0E7U0FDQSxDQUFBO0tBQ0EsQ0FBQSxDQUFBOztBQUVBLE9BQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxhQUFBLEVBQUE7QUFDQSxxQkFBQSxDQUFBLFlBQUEsQ0FBQSxJQUFBLENBQUEsQ0FDQSxXQUFBLEVBQ0EsVUFBQSxTQUFBLEVBQUE7QUFDQSxtQkFBQSxTQUFBLENBQUEsR0FBQSxDQUFBLGlCQUFBLENBQUEsQ0FBQTtTQUNBLENBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQSxDQUFBOztBQUVBLE9BQUEsQ0FBQSxPQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBLE9BQUEsRUFBQSxVQUFBLEVBQUEsV0FBQSxFQUFBLEVBQUEsRUFBQTs7OztBQUlBLFlBQUEsQ0FBQSxlQUFBLEdBQUEsWUFBQTtBQUNBLG1CQUFBLENBQUEsQ0FBQSxPQUFBLENBQUEsSUFBQSxDQUFBO1NBQ0EsQ0FBQTs7QUFFQSxZQUFBLENBQUEsZUFBQSxHQUFBLFlBQUE7Ozs7O0FBS0EsZ0JBQUEsSUFBQSxDQUFBLGVBQUEsRUFBQSxFQUFBO0FBQ0EsdUJBQUEsRUFBQSxDQUFBLElBQUEsQ0FBQSxPQUFBLENBQUEsSUFBQSxDQUFBLENBQUE7YUFDQTs7Ozs7QUFLQSxtQkFBQSxLQUFBLENBQUEsR0FBQSxDQUFBLFVBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxpQkFBQSxDQUFBLFNBQUEsQ0FBQSxZQUFBO0FBQ0EsdUJBQUEsSUFBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBRUEsQ0FBQTs7QUFFQSxZQUFBLENBQUEsT0FBQSxHQUFBLFlBQUE7QUFDQSxnQkFBQSxJQUFBLENBQUEsZUFBQSxFQUFBLEVBQ0EsT0FBQSxDQUFBLENBQUEsT0FBQSxDQUFBLElBQUEsQ0FBQSxLQUFBLENBQUEsS0FFQSxPQUFBLEtBQUEsQ0FBQTtTQUNBLENBQUE7O0FBRUEsWUFBQSxDQUFBLEtBQUEsR0FBQSxVQUFBLFdBQUEsRUFBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxJQUFBLENBQUEsUUFBQSxFQUFBLFdBQUEsQ0FBQSxDQUNBLElBQUEsQ0FBQSxpQkFBQSxDQUFBLFNBQ0EsQ0FBQSxVQUFBLFFBQUEsRUFBQTtBQUNBLHVCQUFBLEVBQUEsQ0FBQSxNQUFBLENBQUEsRUFBQSxPQUFBLEVBQUEsNEJBQUEsRUFBQSxDQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FDQSxDQUFBOztBQUVBLFlBQUEsQ0FBQSxNQUFBLEdBQUEsWUFBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsU0FBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFlBQUE7QUFDQSx1QkFBQSxDQUFBLE9BQUEsRUFBQSxDQUFBO0FBQ0EsMEJBQUEsQ0FBQSxVQUFBLENBQUEsV0FBQSxDQUFBLGFBQUEsQ0FBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0EsQ0FBQTs7QUFFQSxpQkFBQSxpQkFBQSxDQUFBLFFBQUEsRUFBQTtBQUNBLGdCQUFBLElBQUEsR0FBQSxRQUFBLENBQUEsSUFBQSxDQUFBO0FBQ0EsbUJBQUEsQ0FBQSxNQUFBLENBQUEsSUFBQSxDQUFBLEVBQUEsRUFBQSxJQUFBLENBQUEsSUFBQSxDQUFBLENBQUE7QUFDQSxzQkFBQSxDQUFBLFVBQUEsQ0FBQSxXQUFBLENBQUEsWUFBQSxDQUFBLENBQUE7QUFDQSxtQkFBQSxJQUFBLENBQUEsSUFBQSxDQUFBO1NBQ0EsQ0FBQTtLQUVBLENBQUEsQ0FBQTs7QUFFQSxPQUFBLENBQUEsT0FBQSxDQUFBLFNBQUEsRUFBQSxVQUFBLFVBQUEsRUFBQSxXQUFBLEVBQUE7O0FBRUEsWUFBQSxJQUFBLEdBQUEsSUFBQSxDQUFBOztBQUVBLGtCQUFBLENBQUEsR0FBQSxDQUFBLFdBQUEsQ0FBQSxnQkFBQSxFQUFBLFlBQUE7QUFDQSxnQkFBQSxDQUFBLE9BQUEsRUFBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBOztBQUVBLGtCQUFBLENBQUEsR0FBQSxDQUFBLFdBQUEsQ0FBQSxjQUFBLEVBQUEsWUFBQTtBQUNBLGdCQUFBLENBQUEsT0FBQSxFQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7O0FBRUEsWUFBQSxDQUFBLEVBQUEsR0FBQSxJQUFBLENBQUE7QUFDQSxZQUFBLENBQUEsSUFBQSxHQUFBLElBQUEsQ0FBQTs7QUFFQSxZQUFBLENBQUEsTUFBQSxHQUFBLFVBQUEsU0FBQSxFQUFBLElBQUEsRUFBQTtBQUNBLGdCQUFBLENBQUEsRUFBQSxHQUFBLFNBQUEsQ0FBQTtBQUNBLGdCQUFBLENBQUEsSUFBQSxHQUFBLElBQUEsQ0FBQTtTQUNBLENBQUE7O0FBRUEsWUFBQSxDQUFBLE9BQUEsR0FBQSxZQUFBO0FBQ0EsZ0JBQUEsQ0FBQSxFQUFBLEdBQUEsSUFBQSxDQUFBO0FBQ0EsZ0JBQUEsQ0FBQSxJQUFBLEdBQUEsSUFBQSxDQUFBO1NBQ0EsQ0FBQTtLQUVBLENBQUEsQ0FBQTtDQUVBLENBQUEsRUFBQSxDQUFBOztBQ2pKQSxZQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTtBQUNBLGtCQUFBLENBQ0EsS0FBQSxDQUFBLFVBQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxrQkFBQTtBQUNBLG1CQUFBLEVBQUEsMkNBQUE7QUFDQSxrQkFBQSxFQUFBLDJCQUFBO0FBQ0EsZUFBQSxFQUFBO0FBQ0Esa0JBQUEsRUFBQSxnQkFBQSxNQUFBLEVBQUE7QUFDQSx1QkFBQSxNQUFBLENBQUEsWUFBQSxFQUFBLENBQUE7YUFDQTtBQUNBLHVCQUFBLEVBQUEscUJBQUEsTUFBQSxFQUFBO0FBQ0EsdUJBQUEsTUFBQSxDQUFBLFdBQUEsQ0FBQTthQUNBO1NBQ0E7S0FDQSxDQUFBLENBQ0EsS0FBQSxDQUFBLGVBQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxXQUFBO0FBQ0EsbUJBQUEsRUFBQSxpREFBQTtBQUNBLGtCQUFBLEVBQUEsMkJBQUE7S0FDQSxDQUFBLENBQUE7Q0FDQSxDQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFVBQUEsQ0FBQSwyQkFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLFdBQUEsRUFBQSxZQUFBLEVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQSxXQUFBLEVBQUE7QUFDQSxVQUFBLENBQUEsTUFBQSxHQUFBLE1BQUEsQ0FBQTs7QUFFQSxVQUFBLENBQUEsV0FBQSxHQUFBLFVBQUEsT0FBQSxFQUFBOztBQUVBLG1CQUFBLENBQUEsT0FBQSxDQUFBLENBQUE7O0FBRUEsY0FBQSxDQUFBLE1BQUEsQ0FBQSxPQUFBLENBQUEsVUFBQSxLQUFBLEVBQUEsR0FBQSxFQUFBO0FBQ0EsZ0JBQUEsS0FBQSxDQUFBLEdBQUEsS0FBQSxPQUFBLEVBQUE7QUFDQSx1QkFBQSxNQUFBLENBQUEsTUFBQSxDQUFBLE1BQUEsQ0FBQSxHQUFBLEVBQUEsQ0FBQSxDQUFBLENBQUE7YUFDQTtTQUNBLENBQUEsQ0FBQTtLQUNBLENBQUE7Q0FDQSxDQUFBLENBQUE7O0FDckNBLFlBQUEsQ0FBQTtBQUNBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUNBLEtBQUEsQ0FBQSxZQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEscUJBQUE7QUFDQSxtQkFBQSxFQUFBLCtDQUFBO0FBQ0Esa0JBQUEsRUFBQSw2QkFBQTtLQUNBLENBQUEsQ0FDQSxLQUFBLENBQUEsaUJBQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxhQUFBO0FBQ0EsbUJBQUEsRUFBQSxvREFBQTtBQUNBLGtCQUFBLEVBQUEsNkJBQUE7S0FDQSxDQUFBLENBQUE7Q0FDQSxDQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFVBQUEsQ0FBQSw2QkFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLFlBQUEsRUFBQSxLQUFBLEVBQUE7O0FBR0EsU0FBQSxDQUFBLEdBQUEsQ0FBQSxlQUFBLENBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxRQUFBLEVBQUE7QUFDQSxjQUFBLENBQUEsUUFBQSxHQUFBLFFBQUEsQ0FBQSxJQUFBLENBQUE7QUFDQSxlQUFBLE1BQUEsQ0FBQSxRQUFBLENBQUE7S0FDQSxDQUFBLENBQUE7O0FBR0EsUUFBQSxZQUFBLENBQUEsU0FBQSxFQUFBO0FBQ0EsYUFBQSxDQUFBLEdBQUEsQ0FBQSxnQkFBQSxHQUFBLFlBQUEsQ0FBQSxTQUFBLENBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxRQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLFdBQUEsR0FBQSxRQUFBLENBQUEsSUFBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0E7OztBQUlBLFVBQUEsQ0FBQSxXQUFBLEdBQUEsWUFBQTs7OztBQUlBLGVBQUEsQ0FBQSxHQUFBLENBQUEsVUFBQSxDQUFBLENBQUE7S0FLQSxDQUFBOzs7QUFHQSxVQUFBLENBQUEsYUFBQSxHQUFBLFVBQUEsT0FBQSxFQUFBO0FBQ0EsY0FBQSxDQUFBLFFBQUEsQ0FBQSxPQUFBLENBQUEsVUFBQSxZQUFBLEVBQUE7QUFDQSxnQkFBQSxPQUFBLENBQUEsR0FBQSxLQUFBLFlBQUEsQ0FBQSxHQUFBLEVBQUE7QUFDQSxvQkFBQSxLQUFBLEdBQUEsTUFBQSxDQUFBLFFBQUEsQ0FBQSxPQUFBLENBQUEsWUFBQSxDQUFBLENBQUE7QUFDQSx1QkFBQSxNQUFBLENBQUEsUUFBQSxDQUFBLE1BQUEsQ0FBQSxLQUFBLEVBQUEsQ0FBQSxDQUFBLENBQUE7YUFDQTtTQUNBLENBQUEsQ0FBQTs7QUFFQSxhQUFBLFVBQUEsQ0FBQSxnQkFBQSxHQUFBLE9BQUEsQ0FBQSxHQUFBLENBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxRQUFBLEVBQUE7QUFDQSxtQkFBQSxDQUFBLEdBQUEsQ0FBQSxRQUFBLENBQUEsSUFBQSxDQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBO0NBR0EsQ0FBQSxDQUFBOztBQzdEQSxZQUFBLENBQUE7QUFDQSxHQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FDQSxLQUFBLENBQUEsVUFBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLFdBQUE7QUFDQSxtQkFBQSxFQUFBLDJCQUFBO0FBQ0Esa0JBQUEsRUFBQSxvQkFBQTtLQUNBLENBQUEsQ0FDQSxLQUFBLENBQUEsZUFBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLGFBQUE7QUFDQSxtQkFBQSxFQUFBLDhCQUFBO0FBQ0Esa0JBQUEsRUFBQSxvQkFBQTtLQUNBLENBQUEsQ0FDQSxLQUFBLENBQUEscUJBQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxtQkFBQTtBQUNBLG1CQUFBLEVBQUEsa0NBQUE7QUFDQSxrQkFBQSxFQUFBLG9CQUFBO0tBQ0EsQ0FBQSxDQUFBO0NBRUEsQ0FBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxVQUFBLENBQUEsb0JBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxZQUFBLEVBQUEsS0FBQSxFQUFBOzs7QUFHQSxTQUFBLENBQUEsR0FBQSxDQUFBLGVBQUEsQ0FBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLFFBQUEsRUFBQTtBQUNBLGNBQUEsQ0FBQSxRQUFBLEdBQUEsUUFBQSxDQUFBLElBQUEsQ0FBQTtBQUNBLGVBQUEsTUFBQSxDQUFBLFFBQUEsQ0FBQTtLQUNBLENBQUEsQ0FBQTs7QUFJQSxVQUFBLENBQUEsT0FBQSxHQUFBLENBQUEsT0FBQSxFQUFBLEtBQUEsQ0FBQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLE1BQUEsR0FBQSxDQUFBLFFBQUEsRUFBQSxPQUFBLEVBQUEsU0FBQSxDQUFBLENBQUE7O0FBTUEsUUFBQSxZQUFBLENBQUEsZUFBQSxFQUFBOztBQUVBLGFBQUEsQ0FBQSxHQUFBLENBQUEsa0JBQUEsR0FBQSxZQUFBLENBQUEsZUFBQSxDQUFBLENBQ0EsSUFBQSxDQUFBLFVBQUEsUUFBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxlQUFBLEdBQUEsUUFBQSxDQUFBLElBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBOztBQUVBLFFBQUEsWUFBQSxDQUFBLFNBQUEsRUFBQTs7QUFFQSxhQUFBLENBQUEsR0FBQSxDQUFBLGdCQUFBLEdBQUEsWUFBQSxDQUFBLFNBQUEsR0FBQSxVQUFBLENBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxRQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLGNBQUEsR0FBQSxRQUFBLENBQUEsSUFBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBOztBQUVBLGFBQUEsQ0FBQSxHQUFBLENBQUEsZ0JBQUEsR0FBQSxZQUFBLENBQUEsU0FBQSxDQUFBLENBQ0EsSUFBQSxDQUFBLFVBQUEsUUFBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxXQUFBLEdBQUEsUUFBQSxDQUFBLElBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBOzs7OztBQU1BLFVBQUEsQ0FBQSxXQUFBLEdBQUEsVUFBQSxFQUFBLEVBQUE7O0FBRUEsYUFBQSxDQUFBLElBQUEsQ0FBQSxnQkFBQSxHQUFBLEVBQUEsQ0FBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLFFBQUEsRUFBQTtBQUNBLG1CQUFBLENBQUEsR0FBQSxDQUFBLHFCQUFBLEVBQUEsUUFBQSxDQUFBLElBQUEsQ0FBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxVQUFBLENBQUEsVUFBQSxHQUFBO0FBQ0EsZUFBQSxFQUFBLElBQUE7QUFDQSxrQkFBQSxFQUFBLFlBQUEsQ0FBQSxTQUFBO0FBQ0EsYUFBQSxFQUFBLENBQUE7QUFDQSxjQUFBLEVBQUEsRUFBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLGNBQUEsR0FBQSxLQUFBLENBQUE7O0FBRUEsVUFBQSxDQUFBLE1BQUEsQ0FBQSxnQkFBQSxFQUFBLFlBQUE7QUFDQSxjQUFBLENBQUEsbUJBQUEsR0FBQSxNQUFBLENBQUEsY0FBQSxHQUFBLFdBQUEsR0FBQSxZQUFBLENBQUE7S0FDQSxDQUFBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFlBQUEsR0FBQSxVQUFBLE1BQUEsRUFBQTs7QUFFQSxhQUFBLENBQUEsSUFBQSxDQUFBLGdCQUFBLEdBQUEsWUFBQSxDQUFBLFNBQUEsR0FBQSxVQUFBLEVBQUEsTUFBQSxDQUFBLENBQ0EsSUFBQSxDQUFBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsbUJBQUEsQ0FBQSxHQUFBLENBQUEsUUFBQSxDQUFBLElBQUEsQ0FBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBOztBQUVBLGNBQUEsQ0FBQSxVQUFBLEdBQUE7QUFDQSxtQkFBQSxFQUFBLElBQUE7QUFDQSxzQkFBQSxFQUFBLFlBQUEsQ0FBQSxTQUFBO0FBQ0EsaUJBQUEsRUFBQSxDQUFBO0FBQ0Esa0JBQUEsRUFBQSxFQUFBO1NBQ0EsQ0FBQTs7QUFFQSxjQUFBLENBQUEsY0FBQSxHQUFBLEtBQUEsQ0FBQTtLQUNBLENBQUE7Q0FFQSxDQUFBLENBQUE7O0FDdEdBLEdBQUEsQ0FBQSxPQUFBLENBQUEsZUFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBOztBQUVBLFdBQUE7O0FBRUEscUJBQUEsRUFBQSx1QkFBQSxZQUFBLEVBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsSUFBQSxDQUFBLFlBQUEsRUFBQSxZQUFBLENBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxRQUFBLEVBQUE7QUFDQSx1QkFBQSxRQUFBLENBQUEsSUFBQSxDQUFBO2FBQ0EsQ0FBQSxTQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSx1QkFBQSxDQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQTtBQUNBLHVCQUFBLEdBQUEsQ0FBQTthQUNBLENBQUEsQ0FBQTtTQUNBOztLQUVBLENBQUE7Q0FFQSxDQUFBLENBQUE7QUNoQkEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTtBQUNBLGtCQUFBLENBQ0EsS0FBQSxDQUFBLFFBQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxTQUFBO0FBQ0EsbUJBQUEsRUFBQSx1QkFBQTtBQUNBLGtCQUFBLEVBQUEsWUFBQTtLQUNBLENBQUEsQ0FBQTtDQUNBLENBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsVUFBQSxDQUFBLFlBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxXQUFBLEVBQUEsTUFBQSxFQUFBLGFBQUEsRUFBQTs7QUFFQSxVQUFBLENBQUEsS0FBQSxHQUFBLElBQUEsQ0FBQTtBQUNBLFVBQUEsQ0FBQSxNQUFBLEdBQUEsRUFBQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxVQUFBLEdBQUEsVUFBQSxNQUFBLEVBQUE7QUFDQSxjQUFBLENBQUEsS0FBQSxHQUFBLElBQUEsQ0FBQTs7QUFFQSxxQkFBQSxDQUFBLGFBQUEsQ0FBQSxNQUFBLENBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxJQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLEVBQUEsQ0FBQSxNQUFBLENBQUEsQ0FBQTtBQUNBLG1CQUFBLFdBQUEsQ0FBQSxlQUFBLEVBQUEsQ0FBQTtTQUNBLENBQUEsU0FDQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxLQUFBLEdBQUEsOENBQUEsQ0FBQTtBQUNBLG1CQUFBLENBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTtDQUVBLENBQUEsQ0FBQTtBQzVCQSxZQUFBLENBQUE7QUFDQSxHQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FDQSxLQUFBLENBQUEsU0FBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLGlCQUFBO0FBQ0EsbUJBQUEsRUFBQSx5Q0FBQTtBQUNBLGtCQUFBLEVBQUEsMEJBQUE7S0FDQSxDQUFBLENBQ0EsS0FBQSxDQUFBLGNBQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxVQUFBO0FBQ0EsbUJBQUEsRUFBQSw4Q0FBQTtBQUNBLGtCQUFBLEVBQUEsMEJBQUE7S0FDQSxDQUFBLENBQUE7Q0FDQSxDQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFVBQUEsQ0FBQSwwQkFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLFlBQUEsRUFBQSxLQUFBLEVBQUE7O0FBRUEsU0FBQSxDQUFBLEdBQUEsQ0FBQSxZQUFBLENBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxRQUFBLEVBQUE7QUFDQSxjQUFBLENBQUEsS0FBQSxHQUFBLFFBQUEsQ0FBQSxJQUFBLENBQUE7S0FDQSxDQUFBLENBQUE7O0FBRUEsUUFBQSxDQUFBLENBQUEsWUFBQSxDQUFBLE1BQUEsRUFBQTtBQUNBLGFBQUEsQ0FBQSxHQUFBLENBQUEsYUFBQSxHQUFBLFlBQUEsQ0FBQSxNQUFBLENBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxRQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLFFBQUEsR0FBQSxRQUFBLENBQUEsSUFBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0E7OztBQUdBLFVBQUEsQ0FBQSxRQUFBLEdBQUEsWUFBQTtBQUNBLGFBQUEsQ0FBQSxHQUFBLENBQUEsWUFBQSxFQUFBLE1BQUEsQ0FBQSxRQUFBLENBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxRQUFBLEVBQUE7QUFDQSxtQkFBQSxDQUFBLEdBQUEsQ0FBQSxRQUFBLENBQUEsSUFBQSxDQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBOzs7QUFHQSxVQUFBLENBQUEsVUFBQSxHQUFBLFVBQUEsSUFBQSxFQUFBO0FBQ0EsY0FBQSxDQUFBLEtBQUEsQ0FBQSxPQUFBLENBQUEsVUFBQSxTQUFBLEVBQUE7QUFDQSxnQkFBQSxJQUFBLENBQUEsR0FBQSxLQUFBLFNBQUEsQ0FBQSxHQUFBLEVBQUE7QUFDQSxvQkFBQSxLQUFBLEdBQUEsTUFBQSxDQUFBLEtBQUEsQ0FBQSxPQUFBLENBQUEsU0FBQSxDQUFBLENBQUE7QUFDQSx1QkFBQSxNQUFBLENBQUEsS0FBQSxDQUFBLE1BQUEsQ0FBQSxLQUFBLEVBQUEsQ0FBQSxDQUFBLENBQUE7YUFDQTtTQUNBLENBQUEsQ0FBQTs7QUFFQSxhQUFBLFVBQUEsQ0FBQSxhQUFBLEdBQUEsSUFBQSxDQUFBLEdBQUEsQ0FBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLFFBQUEsRUFBQTtBQUNBLG1CQUFBLENBQUEsR0FBQSxDQUFBLFFBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBLENBQUE7Q0FFQSxDQUFBLENBQUE7O0FDcERBLFlBQUEsQ0FBQTtBQUNBLEdBQUEsQ0FBQSxPQUFBLENBQUEsaUJBQUEsRUFBQSxZQUFBOztBQUVBLFFBQUEsa0JBQUEsR0FBQSw0QkFBQSxHQUFBLEVBQUE7QUFDQSxlQUFBLEdBQUEsQ0FBQSxJQUFBLENBQUEsS0FBQSxDQUFBLElBQUEsQ0FBQSxNQUFBLEVBQUEsR0FBQSxHQUFBLENBQUEsTUFBQSxDQUFBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsUUFBQSxTQUFBLEdBQUEsQ0FDQSxlQUFBLEVBQ0EsdUJBQUEsRUFDQSxzQkFBQSxFQUNBLHVCQUFBLEVBQ0EseURBQUEsRUFDQSwwQ0FBQSxDQUNBLENBQUE7O0FBRUEsV0FBQTtBQUNBLGlCQUFBLEVBQUEsU0FBQTtBQUNBLHlCQUFBLEVBQUEsNkJBQUE7QUFDQSxtQkFBQSxrQkFBQSxDQUFBLFNBQUEsQ0FBQSxDQUFBO1NBQ0E7S0FDQSxDQUFBO0NBRUEsQ0FBQSxDQUFBO0FDdkJBLFlBQUEsQ0FBQTs7QUNBQSxZQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLE9BQUEsQ0FBQSxRQUFBLEVBQUEsVUFBQSxXQUFBLEVBQUEsS0FBQSxFQUFBOzs7QUFHQSxRQUFBLFlBQUEsR0FBQSx3QkFBQTtBQUNBLGVBQUEsV0FBQSxDQUFBLGVBQUEsRUFBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLElBQUEsRUFBQTs7QUFFQSxtQkFBQSxDQUFBLEdBQUEsQ0FBQSxhQUFBLENBQUEsQ0FBQTs7QUFFQSxnQkFBQSxHQUFBLEdBQUEsYUFBQSxHQUFBLElBQUEsQ0FBQSxHQUFBLEdBQUEsWUFBQSxDQUFBO0FBQ0EsbUJBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQTtTQUNBLENBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxRQUFBLEVBQUE7QUFDQSxtQkFBQSxRQUFBLENBQUEsSUFBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7O0FBR0EsUUFBQSxXQUFBLEdBQUEscUJBQUEsT0FBQSxFQUFBO0FBQ0EsZUFBQSxXQUFBLENBQUEsZUFBQSxFQUFBLENBQ0EsSUFBQSxDQUFBLFVBQUEsSUFBQSxFQUFBO0FBQ0EsZ0JBQUEsR0FBQSxHQUFBLGFBQUEsR0FBQSxJQUFBLENBQUEsR0FBQSxHQUFBLFVBQUEsR0FBQSxPQUFBLEdBQUEsU0FBQSxDQUFBO0FBQ0EsbUJBQUEsS0FBQSxVQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7U0FDQSxDQUFBLENBQ0EsSUFBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsbUJBQUEsR0FBQSxDQUFBLElBQUEsQ0FBQTtTQUNBLENBQUEsU0FDQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsbUJBQUEsQ0FBQSxHQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7QUFDQSxtQkFBQSxHQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFdBQUE7QUFDQSxvQkFBQSxFQUFBLFlBQUE7QUFDQSxtQkFBQSxFQUFBLFdBQUE7S0FDQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBOztBQ3RDQSxZQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLE9BQUEsQ0FBQSxPQUFBLEVBQUEsVUFBQSxXQUFBLEVBQUEsS0FBQSxFQUFBOztBQUVBLFFBQUEsV0FBQSxHQUFBLHVCQUFBO0FBQ0EsZUFBQSxXQUFBLENBQUEsZUFBQSxFQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsSUFBQSxFQUFBO0FBQ0EsZ0JBQUEsR0FBQSxHQUFBLGFBQUEsQ0FBQTtBQUNBLG1CQUFBLENBQUEsR0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBO0FBQ0EsbUJBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQTtTQUNBLENBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxRQUFBLEVBQUE7QUFDQSxtQkFBQSxRQUFBLENBQUEsSUFBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxXQUFBO0FBQ0EsbUJBQUEsRUFBQSxXQUFBO0tBQ0EsQ0FBQTtDQUNBLENBQUEsQ0FBQTs7OztBQ2hCQSxZQUFBLENBQUE7QUFDQSxHQUFBLENBQUEsU0FBQSxDQUFBLGVBQUEsRUFBQSxZQUFBO0FBQ0EsV0FBQTtBQUNBLGdCQUFBLEVBQUEsR0FBQTtBQUNBLG1CQUFBLEVBQUEseURBQUE7S0FDQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBO0FDUkEsWUFBQSxDQUFBO0FBQ0EsR0FBQSxDQUFBLFNBQUEsQ0FBQSxRQUFBLEVBQUEsVUFBQSxVQUFBLEVBQUEsV0FBQSxFQUFBLFdBQUEsRUFBQSxNQUFBLEVBQUE7Ozs7O0FBS0EsV0FBQTtBQUNBLGdCQUFBLEVBQUEsR0FBQTtBQUNBLGFBQUEsRUFBQSxFQUFBO0FBQ0EsbUJBQUEsRUFBQSx5Q0FBQTtBQUNBLFlBQUEsRUFBQSxjQUFBLEtBQUEsRUFBQTtBQUNBLGlCQUFBLENBQUEsS0FBQSxHQUFBLENBQ0EsRUFBQSxLQUFBLEVBQUEsTUFBQSxFQUFBLEtBQUEsRUFBQSxNQUFBLEVBQUEsRUFDQSxFQUFBLEtBQUEsRUFBQSxVQUFBLEVBQUEsS0FBQSxFQUFBLFVBQUEsRUFBQSxFQUNBLEVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQSxLQUFBLEVBQUEsTUFBQSxFQUFBLEVBQ0EsRUFBQSxLQUFBLEVBQUEsbUJBQUEsRUFBQSxLQUFBLEVBQUEsYUFBQSxFQUFBLElBQUEsRUFBQSxJQUFBLEVBQUEsQ0FDQSxDQUFBO0FBQ0EsaUJBQUEsQ0FBQSxNQUFBLEdBQUEsQ0FDQSxFQUFBLEtBQUEsRUFBQSxvQkFBQSxFQUFBLEtBQUEsRUFBQSxZQUFBLEVBQUEsS0FBQSxFQUFBLElBQUEsRUFBQSxFQUNBLEVBQUEsS0FBQSxFQUFBLGtCQUFBLEVBQUEsS0FBQSxFQUFBLFVBQUEsRUFBQSxLQUFBLEVBQUEsSUFBQSxFQUFBLEVBQ0EsRUFBQSxLQUFBLEVBQUEsaUJBQUEsRUFBQSxLQUFBLEVBQUEsU0FBQSxFQUFBLEtBQUEsRUFBQSxJQUFBLEVBQUEsQ0FDQSxDQUFBOztBQUVBLGlCQUFBLENBQUEsSUFBQSxHQUFBLElBQUEsQ0FBQTs7QUFFQSxpQkFBQSxDQUFBLFVBQUEsR0FBQSxZQUFBO0FBQ0EsdUJBQUEsV0FBQSxDQUFBLGVBQUEsRUFBQSxDQUFBO2FBQ0EsQ0FBQTs7QUFFQSxpQkFBQSxDQUFBLE9BQUEsR0FBQSxZQUFBO0FBQ0EsdUJBQUEsV0FBQSxDQUFBLE9BQUEsRUFBQSxDQUFBO2FBQ0EsQ0FBQTs7QUFFQSxpQkFBQSxDQUFBLE1BQUEsR0FBQSxZQUFBO0FBQ0EsMkJBQUEsQ0FBQSxNQUFBLEVBQUEsQ0FBQSxJQUFBLENBQUEsWUFBQTtBQUNBLDBCQUFBLENBQUEsRUFBQSxDQUFBLE1BQUEsQ0FBQSxDQUFBO2lCQUNBLENBQUEsQ0FBQTthQUNBLENBQUE7O0FBRUEsZ0JBQUEsT0FBQSxHQUFBLG1CQUFBO0FBQ0EsMkJBQUEsQ0FBQSxlQUFBLEVBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxJQUFBLEVBQUE7QUFDQSx5QkFBQSxDQUFBLElBQUEsR0FBQSxJQUFBLENBQUE7aUJBQ0EsQ0FBQSxDQUFBO2FBQ0EsQ0FBQTs7QUFFQSxnQkFBQSxVQUFBLEdBQUEsc0JBQUE7QUFDQSxxQkFBQSxDQUFBLElBQUEsR0FBQSxJQUFBLENBQUE7YUFDQSxDQUFBOztBQUdBLG1CQUFBLEVBQUEsQ0FBQTs7QUFFQSxzQkFBQSxDQUFBLEdBQUEsQ0FBQSxXQUFBLENBQUEsWUFBQSxFQUFBLE9BQUEsQ0FBQSxDQUFBO0FBQ0Esc0JBQUEsQ0FBQSxHQUFBLENBQUEsV0FBQSxDQUFBLGFBQUEsRUFBQSxVQUFBLENBQUEsQ0FBQTtBQUNBLHNCQUFBLENBQUEsR0FBQSxDQUFBLFdBQUEsQ0FBQSxjQUFBLEVBQUEsVUFBQSxDQUFBLENBQUE7U0FFQTs7S0FFQSxDQUFBO0NBRUEsQ0FBQSxDQUFBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG52YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ0Z1bGxzdGFja0dlbmVyYXRlZEFwcCcsIFsndWkucm91dGVyJywgJ2ZzYVByZUJ1aWx0J10pO1xuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkdXJsUm91dGVyUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyKSB7XG4gICAgLy8gVGhpcyB0dXJucyBvZmYgaGFzaGJhbmcgdXJscyAoLyNhYm91dCkgYW5kIGNoYW5nZXMgaXQgdG8gc29tZXRoaW5nIG5vcm1hbCAoL2Fib3V0KVxuICAgICRsb2NhdGlvblByb3ZpZGVyLmh0bWw1TW9kZSh0cnVlKTtcbiAgICAvLyBJZiB3ZSBnbyB0byBhIFVSTCB0aGF0IHVpLXJvdXRlciBkb2Vzbid0IGhhdmUgcmVnaXN0ZXJlZCwgZ28gdG8gdGhlIFwiL1wiIHVybC5cbiAgICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvJyk7XG59KTtcblxuXG4vLyBUaGlzIGFwcC5ydW4gaXMgZm9yIGNvbnRyb2xsaW5nIGFjY2VzcyB0byBzcGVjaWZpYyBzdGF0ZXMuXG5hcHAucnVuKGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBdXRoU2VydmljZSwgJHN0YXRlKSB7XG5cbiAgICAvLyBUaGUgZ2l2ZW4gc3RhdGUgcmVxdWlyZXMgYW4gYXV0aGVudGljYXRlZCB1c2VyLlxuICAgIHZhciBkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoID0gZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgICAgIHJldHVybiBzdGF0ZS5kYXRhICYmIHN0YXRlLmRhdGEuYXV0aGVudGljYXRlO1xuICAgIH07XG5cbiAgICAvLyAkc3RhdGVDaGFuZ2VTdGFydCBpcyBhbiBldmVudCBmaXJlZFxuICAgIC8vIHdoZW5ldmVyIHRoZSBwcm9jZXNzIG9mIGNoYW5naW5nIGEgc3RhdGUgYmVnaW5zLlxuICAgICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uIChldmVudCwgdG9TdGF0ZSwgdG9QYXJhbXMpIHtcblxuICAgICAgICBpZiAoIWRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGgodG9TdGF0ZSkpIHtcbiAgICAgICAgICAgIC8vIFRoZSBkZXN0aW5hdGlvbiBzdGF0ZSBkb2VzIG5vdCByZXF1aXJlIGF1dGhlbnRpY2F0aW9uXG4gICAgICAgICAgICAvLyBTaG9ydCBjaXJjdWl0IHdpdGggcmV0dXJuLlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpKSB7XG4gICAgICAgICAgICAvLyBUaGUgdXNlciBpcyBhdXRoZW50aWNhdGVkLlxuICAgICAgICAgICAgLy8gU2hvcnQgY2lyY3VpdCB3aXRoIHJldHVybi5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENhbmNlbCBuYXZpZ2F0aW5nIHRvIG5ldyBzdGF0ZS5cbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgICAgICAvLyBJZiBhIHVzZXIgaXMgcmV0cmlldmVkLCB0aGVuIHJlbmF2aWdhdGUgdG8gdGhlIGRlc3RpbmF0aW9uXG4gICAgICAgICAgICAvLyAodGhlIHNlY29uZCB0aW1lLCBBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKSB3aWxsIHdvcmspXG4gICAgICAgICAgICAvLyBvdGhlcndpc2UsIGlmIG5vIHVzZXIgaXMgbG9nZ2VkIGluLCBnbyB0byBcImxvZ2luXCIgc3RhdGUuXG4gICAgICAgICAgICBpZiAodXNlcikge1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbyh0b1N0YXRlLm5hbWUsIHRvUGFyYW1zKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdsb2dpbicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgIH0pO1xuXG59KTsiLCJhcHAuZmFjdG9yeSgnQ2FydEZhY3RvcnknLCBmdW5jdGlvbiAoJGh0dHApIHtcblxuICAgIHJldHVybiB7XG5cbiAgICAgICAgZ2V0Q3VycmVudFVzZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vIHRlbXBvcmFyeSB1c2VyIHdvcmtmbG93XG4gICAgICAgICAgICAvLyBnZXQgY3VycmVudCB1c2VyIGZyb20gY29va2llIGlkXG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL3VzZXJzL2N1cnJlbnR1c2VyLycpLnRoZW4oZnVuY3Rpb24ocmVzKXtcbiAgICAgICAgICAgICAgICBpZiAocmVzLmRhdGEpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXMuZGF0YVswXTtcbiAgICAgICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVycjtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGRlbGV0ZVByb2R1Y3RJbkNhcnQ6IGZ1bmN0aW9uICh1c2VySUQsIG9yZGVySUQsIHByb2R1Y3RJRCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLmRlbGV0ZSgnL2FwaS91c2Vycy8nKyB1c2VySUQgKyAnL29yZGVycy8nICsgb3JkZXJJRCArICcvcHJvZHVjdHMvJyArIHByb2R1Y3RJRClcbiAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5kYXRhO1xuICAgICAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlcnI7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfSxcblxuICAgICAgICBwcmljZVN1bTogZnVuY3Rpb24gKGN1cnJlbnRPcmRlcikge1xuICAgICAgICAgICAgdmFyIHRvdGFsID0gMC4wO1xuXG4gICAgICAgICAgICBjdXJyZW50T3JkZXIucHJvZHVjdHMuZm9yRWFjaChmdW5jdGlvbihlbGVtKSB7XG4gICAgICAgICAgICAgICAgdG90YWwgKz0gZWxlbS5pZC5wcmljZSAqIGVsZW0ucXVhbnRpdHk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIHRvdGFsO1xuICAgICAgICB9LFxuXG4gICAgICAgIGl0ZW1Db3VudDogZnVuY3Rpb24gKGN1cnJlbnRPcmRlcikge1xuICAgICAgICAgICAgdmFyIHRvdGFsID0gMDtcblxuICAgICAgICAgICAgY3VycmVudE9yZGVyLnByb2R1Y3RzLmZvckVhY2goZnVuY3Rpb24oZWxlbSkge1xuICAgICAgICAgICAgICAgIHRvdGFsICs9IGVsZW0ucXVhbnRpdHk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIHRvdGFsO1xuICAgICAgICB9LFxuXG4gICAgICAgIHNhdmVPcmRlcjogZnVuY3Rpb24odXNlcklELCBvcmRlcklELCBjdXJyZW50T3JkZXIpIHsgXG4gICAgICAgICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2FwaS91c2Vycy8nKyB1c2VySUQgKyAnL29yZGVycy8nICsgb3JkZXJJRCwgY3VycmVudE9yZGVyKS50aGVuKGZ1bmN0aW9uKHJlcyl7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXMuZGF0YTtcbiAgICAgICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXJyO1xuICAgICAgICAgICAgICAgIH0pOyAgICAgICBcbiAgICAgICAgfVxuXG4gICAgfTtcblxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG4vL1RoZSBDb25maWcgYmVsb3cgZGVmaW5lcyB0aGUgL2NhcnQgc3RhdGUsIHdoaWNoIHdpbGxcbi8vc2hvdyBhbGwgcHJvZHVjdHMgaW4gdGhlIGNhcnQuXG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKXtcbiAgICAkc3RhdGVQcm92aWRlclxuICAgICAgICAuc3RhdGUoJ2NhcnQnLCB7XG4gICAgICAgICAgICB1cmw6ICcvY2FydCcsXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NhcnQvY2FydC5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdDYXJ0Q29udHJvbGxlcidcbiAgICAgICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0NhcnRDb250cm9sbGVyJywgZnVuY3Rpb24oJHNjb3BlLCBDYXJ0RmFjdG9yeSkge1xuICAgIC8vIHRlbXBvcmFyeSB1c2VyIHdvcmtmbG93XG4gICAgLy8gZ2V0IGN1cnJlbnQgdXNlciBmcm9tIGNvb2tpZSBpZFxuJHNjb3BlLnF1YW50aXRpZXMgPSBbMSwyLDMsNCw1LDYsNyw4LDldO1xuXG4gICAgJHNjb3BlLmluaXRpYWxpemVDYXJ0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIENhcnRGYWN0b3J5LmdldEN1cnJlbnRVc2VyKCkudGhlbihmdW5jdGlvbihjdXJyZW50T3JkZXIpIHtcblxuICAgICAgICAgICAgaWYgKGN1cnJlbnRPcmRlciA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnbm90aGluZyBpbiBjYXJ0Jyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICRzY29wZS5kZWZpbmVDYXJ0U2NvcGUoY3VycmVudE9yZGVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgICAgICByZXR1cm4gZXJyO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAkc2NvcGUuZGVsZXRlUHJvZHVjdCA9IGZ1bmN0aW9uKHByb2R1Y3QpIHtcbiAgICAgIC8vREVMRVRFIC9hcGkvdXNlcnMvOnVzZXJpZC9vcmRlcnMvOmFub3JkZXJpZC9wcm9kdWN0cy86YXByb2R1Y3RJRFxuICAgICAgICBDYXJ0RmFjdG9yeS5kZWxldGVQcm9kdWN0SW5DYXJ0KCRzY29wZS5jdXJyZW50T3JkZXIudXNlcl9pZCwgJHNjb3BlLmN1cnJlbnRPcmRlci5faWQsIHByb2R1Y3QuaWQuX2lkKS50aGVuKGZ1bmN0aW9uKG5ld0N1cnJlbnRPcmRlcikge1xuICAgICAgICAgICAgJHNjb3BlLmRlZmluZUNhcnRTY29wZShuZXdDdXJyZW50T3JkZXIpO1xuICAgICAgICB9KS5jYXRjaChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgIHJldHVybiBlcnI7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgICRzY29wZS5zYXZlUXVhbnRpdHkgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgQ2FydEZhY3Rvcnkuc2F2ZU9yZGVyKCRzY29wZS5jdXJyZW50T3JkZXIudXNlcl9pZCwgJHNjb3BlLmN1cnJlbnRPcmRlci5faWQsICRzY29wZS5jdXJyZW50T3JkZXIpLnRoZW4oZnVuY3Rpb24obmV3Q3VycmVudE9yZGVyKSB7XG4gICAgICAgICAgICAkc2NvcGUuZGVmaW5lQ2FydFNjb3BlKG5ld0N1cnJlbnRPcmRlcik7XG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICAgcmV0dXJuIGVycjtcbiAgICAgICAgfSk7ICBcbiAgICB9XG5cbiAgICAkc2NvcGUuZGVmaW5lQ2FydFNjb3BlID0gZnVuY3Rpb24gKGN1cnJlbnRPcmRlcikge1xuICAgICAgICAkc2NvcGUub3JkZXJEYXRhID0gY3VycmVudE9yZGVyLnByb2R1Y3RzO1xuICAgICAgICAkc2NvcGUuY3VycmVudE9yZGVyID0gY3VycmVudE9yZGVyO1xuICAgICAgICAkc2NvcGUucHJpY2VTdW0gPSBDYXJ0RmFjdG9yeS5wcmljZVN1bShjdXJyZW50T3JkZXIpO1xuICAgICAgICAkc2NvcGUuaXRlbUNvdW50ID0gQ2FydEZhY3RvcnkuaXRlbUNvdW50KGN1cnJlbnRPcmRlcik7XG4gICAgICAgICRzY29wZS5zYWxlc1RheCA9ICRzY29wZS5wcmljZVN1bSA+IDAgPyAyOC41MCA6IDA7XG4gICAgICAgICRzY29wZS5zaGlwcGluZ0hhbmRsaW5nID0gJHNjb3BlLnByaWNlU3VtID4gMCA/IDIwLjAwIDogMDtcbiAgICAgICAgJHNjb3BlLnRvdGFsT3JkZXIgPSAkc2NvcGUucHJpY2VTdW0gKyAkc2NvcGUuc2FsZXNUYXggKyAkc2NvcGUuc2hpcHBpbmdIYW5kbGluZztcbiAgICB9XG5cbiAgICAkc2NvcGUuaW5pdGlhbGl6ZUNhcnQoKTtcbn0pOyIsIid1c2Ugc3RyaWN0JztcbmFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXJcbiAgICBcdC5zdGF0ZSgnaG9tZScsIHtcblx0ICAgICAgICB1cmw6ICcvJyxcblx0ICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2hvbWUvaG9tZS5odG1sJyxcblx0ICAgIH0pO1xufSk7XG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2xvZ2luJywge1xuICAgICAgICB1cmw6ICcvbG9naW4nLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2xvZ2luL2xvZ2luLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnTG9naW5DdHJsJ1xuICAgIH0pO1xuXG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0xvZ2luQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsIEF1dGhTZXJ2aWNlLCAkc3RhdGUpIHtcblxuICAgICRzY29wZS5sb2dpbiA9IHt9O1xuICAgICRzY29wZS5lcnJvciA9IG51bGw7XG5cbiAgICAkc2NvcGUuc2VuZExvZ2luID0gZnVuY3Rpb24gKGxvZ2luSW5mbykge1xuXG4gICAgICAgICRzY29wZS5lcnJvciA9IG51bGw7XG5cbiAgICAgICAgQXV0aFNlcnZpY2UubG9naW4obG9naW5JbmZvKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzdGF0ZS5nbygnaG9tZScpO1xuICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuZXJyb3IgPSAnSW52YWxpZCBsb2dpbiBjcmVkZW50aWFscy4nO1xuICAgICAgICB9KTtcblxuICAgIH07XG5cbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnbWVtYmVyc09ubHknLCB7XG4gICAgICAgIHVybDogJy9tZW1iZXJzLWFyZWEnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL21lbWJlcnMtb25seS9tZW1iZXJzLW9ubHkuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdNZW1iZXJDb250cm9sbGVyJyxcbiAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICAgICAgb3JkZXJzOiBmdW5jdGlvbihPcmRlcnMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gT3JkZXJzLmdldEFsbE9yZGVycygpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIC8vIFRoZSBmb2xsb3dpbmcgZGF0YS5hdXRoZW50aWNhdGUgaXMgcmVhZCBieSBhbiBldmVudCBsaXN0ZW5lclxuICAgICAgICAvLyB0aGF0IGNvbnRyb2xzIGFjY2VzcyB0byB0aGlzIHN0YXRlLiBSZWZlciB0byBhcHAuanMuXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGF1dGhlbnRpY2F0ZTogdHJ1ZVxuICAgICAgICB9XG4gICAgfSk7XG5cbn0pO1xuXG5cbmFwcC5jb250cm9sbGVyKCdNZW1iZXJDb250cm9sbGVyJywgZnVuY3Rpb24oJHNjb3BlLCAkaHR0cCwgU2VjcmV0U3Rhc2gsIG9yZGVycywgQXV0aFNlcnZpY2UpIHtcbiAgICAgXG4gICAgIGNvbnNvbGUubG9nKCdtZW1iZXIgY29udHJvbGxlciBoaXQnKVxuXG4gICAgIFNlY3JldFN0YXNoLmdldFN0YXNoKCkudGhlbihmdW5jdGlvbiAoc3Rhc2gpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuc3Rhc2ggPSBzdGFzaDtcbiAgICAgICAgICAgIH0pO1xuICAgICBcbiAgICAgJHNjb3BlLm9yZGVyID0gb3JkZXJzXG5cblxuICAgIGNvbnNvbGUubG9nKCdjYWxsaW5nIGNvbnRyb2xsZXInLCBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uKGRhdGEpIHtyZXR1cm4gZGF0YX0pKVxuXG4gICAgIC8vICRodHRwLmdldCgnL3Nlc3Npb24nLCBmdW5jdGlvbihlcnIsIGRhdGEpIHtcbiAgICAgLy8gICAgaWYgKGVycikgcmV0dXJuIGNvbnNvbGUubG9nKGVycik7XG4gICAgIC8vICAgIGNvbnNvbGUubG9nKCd0aGlzIGlzIHRoZSBkYXRhJywgZGF0YSlcbiAgICAgLy8gfVxuICAgICAvLyBhdXRoc2VydmljZSBmb3IgbG9jYWxob3N0OjEzMzcvc2Vzc2lvblxuXG5cblxufSlcblxuYXBwLmZhY3RvcnkoJ1NlY3JldFN0YXNoJywgZnVuY3Rpb24gKCRodHRwKSB7XG5cbiAgICB2YXIgZ2V0U3Rhc2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvbWVtYmVycy9zZWNyZXQtc3Rhc2gnKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBnZXRTdGFzaDogZ2V0U3Rhc2hcbiAgICB9O1xuXG59KTsiLCIoZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLy8gSG9wZSB5b3UgZGlkbid0IGZvcmdldCBBbmd1bGFyISBEdWgtZG95LlxuICAgIGlmICghd2luZG93LmFuZ3VsYXIpIHRocm93IG5ldyBFcnJvcignSSBjYW5cXCd0IGZpbmQgQW5ndWxhciEnKTtcblxuICAgIHZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnZnNhUHJlQnVpbHQnLCBbXSk7XG5cbiAgICBhcHAuZmFjdG9yeSgnU29ja2V0JywgZnVuY3Rpb24gKCRsb2NhdGlvbikge1xuXG4gICAgICAgIGlmICghd2luZG93LmlvKSB0aHJvdyBuZXcgRXJyb3IoJ3NvY2tldC5pbyBub3QgZm91bmQhJyk7XG5cbiAgICAgICAgdmFyIHNvY2tldDtcblxuICAgICAgICBpZiAoJGxvY2F0aW9uLiQkcG9ydCkge1xuICAgICAgICAgICAgc29ja2V0ID0gaW8oJ2h0dHA6Ly9sb2NhbGhvc3Q6MTMzNycpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc29ja2V0ID0gaW8oJy8nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzb2NrZXQ7XG5cbiAgICB9KTtcblxuICAgIC8vIEFVVEhfRVZFTlRTIGlzIHVzZWQgdGhyb3VnaG91dCBvdXIgYXBwIHRvXG4gICAgLy8gYnJvYWRjYXN0IGFuZCBsaXN0ZW4gZnJvbSBhbmQgdG8gdGhlICRyb290U2NvcGVcbiAgICAvLyBmb3IgaW1wb3J0YW50IGV2ZW50cyBhYm91dCBhdXRoZW50aWNhdGlvbiBmbG93LlxuICAgIGFwcC5jb25zdGFudCgnQVVUSF9FVkVOVFMnLCB7XG4gICAgICAgIGxvZ2luU3VjY2VzczogJ2F1dGgtbG9naW4tc3VjY2VzcycsXG4gICAgICAgIGxvZ2luRmFpbGVkOiAnYXV0aC1sb2dpbi1mYWlsZWQnLFxuICAgICAgICBsb2dvdXRTdWNjZXNzOiAnYXV0aC1sb2dvdXQtc3VjY2VzcycsXG4gICAgICAgIHNlc3Npb25UaW1lb3V0OiAnYXV0aC1zZXNzaW9uLXRpbWVvdXQnLFxuICAgICAgICBub3RBdXRoZW50aWNhdGVkOiAnYXV0aC1ub3QtYXV0aGVudGljYXRlZCcsXG4gICAgICAgIG5vdEF1dGhvcml6ZWQ6ICdhdXRoLW5vdC1hdXRob3JpemVkJ1xuICAgIH0pO1xuXG4gICAgYXBwLmZhY3RvcnkoJ0F1dGhJbnRlcmNlcHRvcicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCAkcSwgQVVUSF9FVkVOVFMpIHtcbiAgICAgICAgdmFyIHN0YXR1c0RpY3QgPSB7XG4gICAgICAgICAgICA0MDE6IEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQsXG4gICAgICAgICAgICA0MDM6IEFVVEhfRVZFTlRTLm5vdEF1dGhvcml6ZWQsXG4gICAgICAgICAgICA0MTk6IEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LFxuICAgICAgICAgICAgNDQwOiBBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dFxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzcG9uc2VFcnJvcjogZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KHN0YXR1c0RpY3RbcmVzcG9uc2Uuc3RhdHVzXSwgcmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QocmVzcG9uc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0pO1xuXG4gICAgYXBwLmNvbmZpZyhmdW5jdGlvbiAoJGh0dHBQcm92aWRlcikge1xuICAgICAgICAkaHR0cFByb3ZpZGVyLmludGVyY2VwdG9ycy5wdXNoKFtcbiAgICAgICAgICAgICckaW5qZWN0b3InLFxuICAgICAgICAgICAgZnVuY3Rpb24gKCRpbmplY3Rvcikge1xuICAgICAgICAgICAgICAgIHJldHVybiAkaW5qZWN0b3IuZ2V0KCdBdXRoSW50ZXJjZXB0b3InKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgXSk7XG4gICAgfSk7XG5cbiAgICBhcHAuc2VydmljZSgnQXV0aFNlcnZpY2UnLCBmdW5jdGlvbiAoJGh0dHAsIFNlc3Npb24sICRyb290U2NvcGUsIEFVVEhfRVZFTlRTLCAkcSkge1xuXG4gICAgICAgIC8vIFVzZXMgdGhlIHNlc3Npb24gZmFjdG9yeSB0byBzZWUgaWYgYW5cbiAgICAgICAgLy8gYXV0aGVudGljYXRlZCB1c2VyIGlzIGN1cnJlbnRseSByZWdpc3RlcmVkLlxuICAgICAgICB0aGlzLmlzQXV0aGVudGljYXRlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAhIVNlc3Npb24udXNlcjtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldExvZ2dlZEluVXNlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vIElmIGFuIGF1dGhlbnRpY2F0ZWQgc2Vzc2lvbiBleGlzdHMsIHdlXG4gICAgICAgICAgICAvLyByZXR1cm4gdGhlIHVzZXIgYXR0YWNoZWQgdG8gdGhhdCBzZXNzaW9uXG4gICAgICAgICAgICAvLyB3aXRoIGEgcHJvbWlzZS4gVGhpcyBlbnN1cmVzIHRoYXQgd2UgY2FuXG4gICAgICAgICAgICAvLyBhbHdheXMgaW50ZXJmYWNlIHdpdGggdGhpcyBtZXRob2QgYXN5bmNocm9ub3VzbHkuXG4gICAgICAgICAgICBpZiAodGhpcy5pc0F1dGhlbnRpY2F0ZWQoKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcS53aGVuKFNlc3Npb24udXNlcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIE1ha2UgcmVxdWVzdCBHRVQgL3Nlc3Npb24uXG4gICAgICAgICAgICAvLyBJZiBpdCByZXR1cm5zIGEgdXNlciwgY2FsbCBvblN1Y2Nlc3NmdWxMb2dpbiB3aXRoIHRoZSByZXNwb25zZS5cbiAgICAgICAgICAgIC8vIElmIGl0IHJldHVybnMgYSA0MDEgcmVzcG9uc2UsIHdlIGNhdGNoIGl0IGFuZCBpbnN0ZWFkIHJlc29sdmUgdG8gbnVsbC5cbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9zZXNzaW9uJykudGhlbihvblN1Y2Nlc3NmdWxMb2dpbikuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfTtcblxuXHRcdHRoaXMuaXNBZG1pbiA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYgKHRoaXMuaXNBdXRoZW50aWNhdGVkKCkpXG5cdFx0XHRcdHJldHVybiAhIVNlc3Npb24udXNlci5hZG1pbjtcblx0XHRcdGVsc2Vcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdHRoaXMubG9naW4gPSBmdW5jdGlvbiAoY3JlZGVudGlhbHMpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvbG9naW4nLCBjcmVkZW50aWFscylcbiAgICAgICAgICAgICAgICAudGhlbihvblN1Y2Nlc3NmdWxMb2dpbilcbiAgICAgICAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QoeyBtZXNzYWdlOiAnSW52YWxpZCBsb2dpbiBjcmVkZW50aWFscy4nIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL2xvZ291dCcpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIFNlc3Npb24uZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChBVVRIX0VWRU5UUy5sb2dvdXRTdWNjZXNzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIGZ1bmN0aW9uIG9uU3VjY2Vzc2Z1bExvZ2luKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICBTZXNzaW9uLmNyZWF0ZShkYXRhLmlkLCBkYXRhLnVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ2luU3VjY2Vzcyk7XG4gICAgICAgICAgICByZXR1cm4gZGF0YS51c2VyO1xuICAgICAgICB9O1xuXG4gICAgfSk7XG5cbiAgICBhcHAuc2VydmljZSgnU2Vzc2lvbicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBVVRIX0VWRU5UUykge1xuXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5ub3RBdXRoZW50aWNhdGVkLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLmRlc3Ryb3koKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYuZGVzdHJveSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmlkID0gbnVsbDtcbiAgICAgICAgdGhpcy51c2VyID0gbnVsbDtcblxuICAgICAgICB0aGlzLmNyZWF0ZSA9IGZ1bmN0aW9uIChzZXNzaW9uSWQsIHVzZXIpIHtcbiAgICAgICAgICAgIHRoaXMuaWQgPSBzZXNzaW9uSWQ7XG4gICAgICAgICAgICB0aGlzLnVzZXIgPSB1c2VyO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy51c2VyID0gbnVsbDtcbiAgICAgICAgfTtcblxuICAgIH0pO1xuXG59KSgpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXHQkc3RhdGVQcm92aWRlclxuXHRcdC5zdGF0ZSgnb3JkZXJNZ3QnLCB7XG5cdFx0XHR1cmw6ICcvb3JkZXJNYW5hZ2VtZW50Jyxcblx0XHRcdHRlbXBsYXRlVXJsOiAnanMvb3JkZXItbWFuYWdlbWVudC9vcmRlci1tYW5hZ2VtZW50Lmh0bWwnLFxuXHRcdFx0Y29udHJvbGxlcjogJ09yZGVyTWFuYWdlbWVudENvbnRyb2xsZXInLFxuXHRcdFx0cmVzb2x2ZToge1xuXHRcdFx0XHRvcmRlcnM6IGZ1bmN0aW9uKE9yZGVycykge1xuXHRcdFx0XHRcdHJldHVybiBPcmRlcnMuZ2V0QWxsT3JkZXJzKClcblx0XHRcdFx0fSxcblx0XHRcdFx0ZGVsZXRlT3JkZXI6IGZ1bmN0aW9uIChPcmRlcnMpIHtcblx0XHRcdFx0XHRyZXR1cm4gT3JkZXJzLmRlbGV0ZU9yZGVyO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSlcblx0XHQuc3RhdGUoJ29yZGVyTWd0LmVkaXQnLCB7XG5cdFx0XHR1cmw6ICcvOm9yZGVySUQnLFxuXHRcdFx0dGVtcGxhdGVVcmw6ICdqcy9vcmRlci1tYW5hbmdlbWVudC9vcmRlci1tYW5hZ2VtZW50LWVkaXQuaHRtbCcsXG5cdFx0XHRjb250cm9sbGVyOiAnT3JkZXJNYW5hZ2VtZW50Q29udHJvbGxlcidcblx0XHR9KVxufSk7XG5cbmFwcC5jb250cm9sbGVyKCdPcmRlck1hbmFnZW1lbnRDb250cm9sbGVyJywgZnVuY3Rpb24oJHNjb3BlLCBBdXRoU2VydmljZSwgJHN0YXRlUGFyYW1zLCAkaHR0cCwgb3JkZXJzLCBkZWxldGVPcmRlcikge1xuXHRcdCRzY29wZS5vcmRlcnMgPSBvcmRlcnM7XG5cblx0XHQkc2NvcGUuZGVsZXRlT3JkZXIgPSBmdW5jdGlvbihvcmRlcklEKSB7XG5cdFx0XHQvLyBEZWxldGUgdGhlIG9yZGVyIGZyb20gdGhlIGRhdGFiYXNlXG5cdFx0XHRkZWxldGVPcmRlcihvcmRlcklEKVxuXHRcdFx0XG5cdFx0XHQkc2NvcGUub3JkZXJzLmZvckVhY2goZnVuY3Rpb24gKG9yZGVyLCBpZHgpIHtcblx0XHRcdFx0aWYgKG9yZGVyLl9pZCA9PT0gb3JkZXJJRCkge1xuXHRcdFx0XHRcdHJldHVybiAkc2NvcGUub3JkZXJzLnNwbGljZShpZHgsIDEpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXHRcdH1cbn0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlclxuXHQgICAgLnN0YXRlKCdwcm9kdWN0TWd0Jywge1xuXHQgICAgICAgIHVybDogJy9wcm9kdWN0TWFuYWdlbWVudC8nLFxuXHQgICAgICAgIHRlbXBsYXRlVXJsOiAnanMvcHJvZHVjdC1tYW5hZ2VtZW50L3Byb2R1Y3QtbWFuYWdlbWVudC5odG1sJyxcblx0ICAgICAgICBjb250cm9sbGVyOiAnUHJvZHVjdE1hbmFnZW1lbnRDb250cm9sbGVyJ1xuXHQgICAgfSkgIFxuXHQgICAgLnN0YXRlKCdwcm9kdWN0TWd0LmVkaXQnLCB7XG5cdCAgICBcdHVybDogJy86cHJvZHVjdElEJyxcblx0ICAgIFx0dGVtcGxhdGVVcmw6ICdqcy9wcm9kdWN0LW1hbmFnZW1lbnQvcHJvZHVjdC1tYW5hZ2VtZW50LWVkaXQuaHRtbCcsXG5cdCAgICBcdGNvbnRyb2xsZXI6ICdQcm9kdWN0TWFuYWdlbWVudENvbnRyb2xsZXInXG5cdCAgICB9KVxufSk7XG5cbmFwcC5jb250cm9sbGVyKCdQcm9kdWN0TWFuYWdlbWVudENvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCAkc3RhdGVQYXJhbXMsICRodHRwKSB7IFxuXG5cblx0JGh0dHAuZ2V0KCcvYXBpL3Byb2R1Y3RzJylcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAkc2NvcGUucHJvZHVjdHMgPSByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgcmV0dXJuICRzY29wZS5wcm9kdWN0cztcbiAgICAgICAgfSlcdFxuXG5cblx0aWYoJHN0YXRlUGFyYW1zLnByb2R1Y3RJRCkge1xuXHQgICAgJGh0dHAuZ2V0KCcvYXBpL3Byb2R1Y3RzLycgKyAkc3RhdGVQYXJhbXMucHJvZHVjdElEKVxuXHRcdFx0LnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG5cdFx0XHRcdCRzY29wZS5wcm9kdWN0SXRlbSA9IHJlc3BvbnNlLmRhdGE7XG5cdFx0XHR9KVxuXHR9XG5cblxuXHQvLyB0aGlzIGZ1bmN0aW9uIGlzIHVzZWQgd2hlbiBzYXZpbmcgZWRpdHMgdG8gZXhpc3RpbmcgcHJvZHVjdHMgLU5DIDUvMi8xNVxuXHQkc2NvcGUuc2F2ZVByb2R1Y3QgPSBmdW5jdGlvbigpIHtcblx0XHQvLyBjb25zb2xlLmxvZygndGhpcyBpcyByb290IHNjb3BlJywgJHJvb3RTY29wZS5wcm9kdWN0SXRlbSlcblxuXHRcdC8vICRyb290U2NvcGUucHJvZHVjdHMucHVzaCgkc2NvcGUucHJvZHVjdEl0ZW0pXG5cdFx0Y29uc29sZS5sb2coJ3lvb29vb29vJylcblx0XHQvLyAkaHR0cC5wdXQoJy9hcGkvcHJvZHVjdHMnLCAkc2NvcGUucHJvZHVjdEl0ZW0pXG5cdFx0Ly8gXHQudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcblx0XHQvLyBcdFx0Y29uc29sZS5sb2cocmVzcG9uc2UuZGF0YSk7XG5cdFx0Ly8gXHR9KVxuXHR9O1xuXG5cdC8vIHJlbW92ZXMgYSBwcm9kdWN0IC1OQyA1LzIvMTVcblx0JHNjb3BlLnJlbW92ZVByb2R1Y3QgPSBmdW5jdGlvbihwcm9kdWN0KSB7XG5cdFx0JHNjb3BlLnByb2R1Y3RzLmZvckVhY2goIGZ1bmN0aW9uKHNjb3BlUHJvZHVjdCkge1xuXHRcdFx0aWYgKHByb2R1Y3QuX2lkID09PSBzY29wZVByb2R1Y3QuX2lkICkge1xuXHRcdFx0XHR2YXIgaW5kZXggPSAkc2NvcGUucHJvZHVjdHMuaW5kZXhPZihzY29wZVByb2R1Y3QpO1xuXHRcdFx0XHRyZXR1cm4gJHNjb3BlLnByb2R1Y3RzLnNwbGljZShpbmRleCwgMSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQkaHR0cC5kZWxldGUoJy9hcGkvcHJvZHVjdHMvJyArIHByb2R1Y3QuX2lkKVxuXHRcdFx0LnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKHJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0fSlcblx0fVxuXG5cbn0pXG5cbiIsIid1c2Ugc3RyaWN0JztcbmFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXJcblx0ICAgIC5zdGF0ZSgncHJvZHVjdHMnLCB7XG5cdCAgICAgICAgdXJsOiAnL3Byb2R1Y3RzJyxcblx0ICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL3Byb2R1Y3RzL3Byb2R1Y3RzLmh0bWwnLFxuXHQgICAgICAgIGNvbnRyb2xsZXI6ICdQcm9kdWN0c0NvbnRyb2xsZXInXG5cdCAgICB9KVxuXHQgICAgLnN0YXRlKCdwcm9kdWN0cy5pdGVtJywge1xuXHQgICAgXHR1cmw6ICcvOnByb2R1Y3RJRCcsXG5cdCAgICBcdHRlbXBsYXRlVXJsOiAnanMvcHJvZHVjdHMvcHJvZHVjdEl0ZW0uaHRtbCcsXG5cdCAgICBcdGNvbnRyb2xsZXI6ICdQcm9kdWN0c0NvbnRyb2xsZXInXG5cdCAgICB9KVxuXHRcdC5zdGF0ZSgncHJvZHVjdHMuY2F0ZWdvcmllcycsIHtcblx0ICAgIFx0dXJsOiAnLzpwcm9kdWN0Q2F0ZWdvcnknLFxuXHQgICAgXHR0ZW1wbGF0ZVVybDogJ2pzL3Byb2R1Y3RzL3Byb2R1Y3RDYXRlZ29yeS5odG1sJyxcblx0ICAgIFx0Y29udHJvbGxlcjogJ1Byb2R1Y3RzQ29udHJvbGxlcidcblx0ICAgIH0pXG5cdCAgICAgICAgXG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ1Byb2R1Y3RzQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsICRzdGF0ZVBhcmFtcywgJGh0dHApIHsgXG5cblx0Ly8gcmVxdWVzdCB0byBnZXQgbGlzdCBvZiBwcm9kdWN0cyAtIE5DIDQvMjYvMjAxNVxuXHQkaHR0cC5nZXQoJy9hcGkvcHJvZHVjdHMnKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICRzY29wZS5wcm9kdWN0cyA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICByZXR1cm4gJHNjb3BlLnByb2R1Y3RzXG4gICAgICAgIH0pXHRcbiAgICAgICAgXG5cblxuICAgICRzY29wZS5nZW5kZXJzID0gWyd3b21lbicsICdtZW4nXTtcbiAgICAkc2NvcGUuYnJhbmRzID0gWydPYWtsZXknLCAnUHJhZGEnLCAnUmF5LUJhbiddO1xuXG5cblxuXG5cbiAgIFx0aWYoJHN0YXRlUGFyYW1zLnByb2R1Y3RDYXRlZ29yeSkge1xuXHRcdC8vIHJlcXVlc3QgdG8gZ2V0IGxpc3Qgb2YgY2F0ZWdvcmllcyAtIE5DIDQvMjYvMjAxNVxuXHRcdCRodHRwLmdldCgnL2FwaS9jYXRlZ29yaWVzLycgKyAkc3RhdGVQYXJhbXMucHJvZHVjdENhdGVnb3J5KVxuXHRcdFx0LnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG5cdFx0XHRcdCRzY29wZS5wcm9kdWN0Q2F0ZWdvcnkgPSByZXNwb25zZS5kYXRhO1xuXHRcdFx0fSlcblx0fVxuXG5cdGlmKCRzdGF0ZVBhcmFtcy5wcm9kdWN0SUQpIHtcblx0XHQvLyByZXF1ZXN0IHRvIGdldCBwcm9kdWN0IHJldmlld3MgLSBOQyA0LzI2LzIwMTVcblx0XHQkaHR0cC5nZXQoJy9hcGkvcHJvZHVjdHMvJyArICRzdGF0ZVBhcmFtcy5wcm9kdWN0SUQgKyAnL3Jldmlld3MnKVxuXHRcdFx0LnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG5cdFx0XHRcdCRzY29wZS5wcm9kdWN0UmV2aWV3cyA9IHJlc3BvbnNlLmRhdGFcblx0XHRcdH0pXG5cdCAgICAvLyByZXF1ZXN0IHRvIGdldCBzaW5nbGUgcHJvZHVjdCAtIE5DIDQvMjYvMjAxNVxuXHQgICAgJGh0dHAuZ2V0KCcvYXBpL3Byb2R1Y3RzLycgKyAkc3RhdGVQYXJhbXMucHJvZHVjdElEKVxuXHRcdFx0LnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG5cdFx0XHRcdCRzY29wZS5wcm9kdWN0SXRlbSA9IHJlc3BvbnNlLmRhdGE7XG5cdFx0XHR9KVxuXHR9XG5cblxuXHQvLyBjb25zb2xlLmxvZygndGhpcyBpcyB0aGUgbG9nZ2VkIGluIHVzZXInLCBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKSlcblxuXHQvLyBmdW5jdGlvbiB0byBhZGQgYW4gb3JkZXIgdG8gZGF0YWJhc2UgLSBOQyA0LzI2LzIwMTVcblx0JHNjb3BlLmNyZWF0ZU9yZGVyID0gZnVuY3Rpb24oaWQpIHtcblx0XHQvLyBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uKGRhdGEpIHtjb25zb2xlLmxvZyhkYXRhLl9pZCl9KSAgLy8gdGhpcyBnaXZlcyBtZSB0aGUgbG9nZ2VkIGluIHVzZXJcblx0XHQkaHR0cC5wb3N0KCcvYXBpL3Byb2R1Y3RzLycgKyBpZClcblx0XHRcdC50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuXHRcdFx0XHRjb25zb2xlLmxvZygnc3VjY2Vzc2Z1bGx5IHBvc3RlZCcsIHJlc3BvbnNlLmRhdGEpXG5cdFx0XHR9KVxuXHR9XG5cblx0JHNjb3BlLnJldmlld0l0ZW0gPSB7XG5cdCAgICAgIHVzZXJfaWQ6IG51bGwsXG5cdCAgICAgIHByb2R1Y3RfaWQ6ICRzdGF0ZVBhcmFtcy5wcm9kdWN0SUQsXG5cdCAgICAgIHN0YXJzOiAwLFxuXHQgICAgICByZXZpZXc6ICcnXG5cdCAgfTtcblxuXHQgICRzY29wZS5zaG93UmV2aWV3Rm9ybSA9IGZhbHNlO1xuXG5cdCAgJHNjb3BlLiR3YXRjaCgnc2hvd1Jldmlld0Zvcm0nLCBmdW5jdGlvbigpe1xuXHQgICAgICAkc2NvcGUuYWRkUmV2aWV3QnV0dG9uVGV4dCA9ICRzY29wZS5zaG93UmV2aWV3Rm9ybSA/ICdIaWRlIEZvcm0nIDogJ0FkZCBSZXZpZXcnO1xuXHQgIH0pXG5cblx0ICAkc2NvcGUuc3VibWl0UmV2aWV3ID0gZnVuY3Rpb24gKHJldmlldykge1xuXG5cdCAgICAgICRodHRwLnBvc3QoJy9hcGkvcHJvZHVjdHMvJyArICRzdGF0ZVBhcmFtcy5wcm9kdWN0SUQgKyAnL3Jldmlld3MnLCByZXZpZXcpXG5cdCAgICAgIFx0LnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG5cdCAgICAgIFx0XHRjb25zb2xlLmxvZyhyZXNwb25zZS5kYXRhKTtcblx0ICAgICAgXHR9KTtcblxuXHQgICAgICAkc2NvcGUucmV2aWV3SXRlbSA9IHtcblx0ICAgICAgICAgIHVzZXJfaWQ6IG51bGwsXG5cdCAgICAgICAgICBwcm9kdWN0X2lkOiAkc3RhdGVQYXJhbXMucHJvZHVjdElELFxuXHQgICAgICAgICAgc3RhcnM6IDAsXG5cdCAgICAgICAgICByZXZpZXc6ICcnXG5cdCAgICAgIH07XG5cblx0ICAgICAgJHNjb3BlLnNob3dSZXZpZXdGb3JtID0gZmFsc2U7XG5cdCAgfTtcblxufSk7XG5cblxuXG5cbiIsImFwcC5mYWN0b3J5KCdTaWduVXBGYWN0b3J5JywgZnVuY3Rpb24gKCRodHRwKSB7XG5cbiAgICByZXR1cm4ge1xuXG4gICAgICAgIHNpZ251cE5ld1VzZXI6IGZ1bmN0aW9uIChzaWdudXBPYmplY3QpIHtcbiAgICAgICAgICAgIHJldHVybiAgJGh0dHAucG9zdCgnL2FwaS91c2VycycsIHNpZ251cE9iamVjdClcbiAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXJyO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgfTtcblxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpe1xuICAgICRzdGF0ZVByb3ZpZGVyXG4gICAgICAgIC5zdGF0ZSgnc2lnbnVwJywge1xuICAgICAgICAgICAgdXJsOiAnL3NpZ251cCcsXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL3NpZ251cC9zaWdudXAuaHRtbCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnU2lnblVwQ3RybCdcbiAgICAgICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ1NpZ25VcEN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCBBdXRoU2VydmljZSwgJHN0YXRlLCBTaWduVXBGYWN0b3J5KSB7XG5cbiAgICAkc2NvcGUuZXJyb3IgPSBudWxsO1xuICAgICRzY29wZS5zaWdudXAgPSB7fTtcblxuICAgICRzY29wZS5zZW5kU2lnbnVwID0gZnVuY3Rpb24gKHNpZ251cCkge1xuICAgICAgICAkc2NvcGUuZXJyb3IgPSBudWxsO1xuXG4gICAgICAgIFNpZ25VcEZhY3Rvcnkuc2lnbnVwTmV3VXNlcihzaWdudXApXG5cdCAgICAgICAgLnRoZW4oZnVuY3Rpb24odXNlcikge1xuXHQgICAgICAgIFx0JHN0YXRlLmdvKCdob21lJyk7XG5cdCAgICAgICAgXHRyZXR1cm4gQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCk7XG5cdCAgICAgICAgfSlcblx0ICAgICAgICAuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XG5cdCAgICAgICAgXHQkc2NvcGUuZXJyb3IgPSAnU2lnbiB1cCBmb3JtIG5vdCBjb21wbGV0ZWQvZmlsbGVkIGNvcnJlY3RseSEnO1xuXHQgICAgICAgIFx0Y29uc29sZS5lcnJvcihlcnIpO1xuXHQgICAgICAgIH0pXG4gICAgfTtcblxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlclxuXHQgICAgLnN0YXRlKCd1c2VyTWd0Jywge1xuXHQgICAgICAgIHVybDogJy91c2VyTWFuYWdlbWVudCcsXG5cdCAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy91c2VyLW1hbmFnZW1lbnQvdXNlci1tYW5hZ2VtZW50Lmh0bWwnLFxuXHQgICAgICAgIGNvbnRyb2xsZXI6ICdVc2VyTWFuYWdlbWVudENvbnRyb2xsZXInXG5cdCAgICB9KSAgXG5cdCAgICAuc3RhdGUoJ3VzZXJNZ3QuZWRpdCcsIHtcblx0ICAgIFx0dXJsOiAnLzp1c2VySUQnLFxuXHQgICAgXHR0ZW1wbGF0ZVVybDogJ2pzL3VzZXItbWFuYWdlbWVudC91c2VyLW1hbmFnZW1lbnQtZWRpdC5odG1sJyxcblx0ICAgIFx0Y29udHJvbGxlcjogJ1VzZXJNYW5hZ2VtZW50Q29udHJvbGxlcidcblx0ICAgIH0pXG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ1VzZXJNYW5hZ2VtZW50Q29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsICRzdGF0ZVBhcmFtcywgJGh0dHApIHsgXG5cblx0JGh0dHAuZ2V0KCcvYXBpL3VzZXJzJylcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAkc2NvcGUudXNlcnMgPSByZXNwb25zZS5kYXRhO1xuICAgICAgICB9KVx0XG5cblx0aWYgKCEhJHN0YXRlUGFyYW1zLnVzZXJJRCkge1xuXHRcdCAkaHR0cC5nZXQoJy9hcGkvdXNlcnMvJyArICRzdGF0ZVBhcmFtcy51c2VySUQpXG5cdFx0XHQudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcblx0XHRcdFx0JHNjb3BlLnVzZXJJdGVtID0gcmVzcG9uc2UuZGF0YTtcblx0XHR9KVxuXHR9XG5cblx0Ly8gdGhpcyBmdW5jdGlvbiBpcyB1c2VkIHdoZW4gc2F2aW5nIGVkaXRzIHRvIGV4aXN0aW5nIHVzZXJzIC1OQyA1LzIvMTVcblx0JHNjb3BlLnNhdmVVc2VyID0gZnVuY3Rpb24oKSB7XG5cdFx0JGh0dHAucHV0KCcvYXBpL3VzZXJzJywgJHNjb3BlLnVzZXJJdGVtKVxuXHRcdFx0LnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKHJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0fSlcblx0fVxuXG5cdC8vIHJlbW92ZXMgYSB1c2VyIC1OQyA1LzIvMTVcblx0JHNjb3BlLnJlbW92ZVVzZXIgPSBmdW5jdGlvbih1c2VyKSB7XG5cdFx0JHNjb3BlLnVzZXJzLmZvckVhY2goIGZ1bmN0aW9uKHNjb3BlVXNlcikge1xuXHRcdFx0aWYgKHVzZXIuX2lkID09PSBzY29wZVVzZXIuX2lkICkge1xuXHRcdFx0XHR2YXIgaW5kZXggPSAkc2NvcGUudXNlcnMuaW5kZXhPZihzY29wZVVzZXIpO1xuXHRcdFx0XHRyZXR1cm4gJHNjb3BlLnVzZXJzLnNwbGljZShpbmRleCwgMSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0XG5cdFx0JGh0dHAuZGVsZXRlKCcvYXBpL3VzZXJzLycgKyB1c2VyLl9pZClcblx0XHRcdC50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhyZXNwb25zZS5kYXRhKTtcblx0XHRcdH0pXG5cdH07XG5cbn0pXG4iLCIndXNlIHN0cmljdCc7XG5hcHAuZmFjdG9yeSgnUmFuZG9tR3JlZXRpbmdzJywgZnVuY3Rpb24gKCkge1xuXG4gICAgdmFyIGdldFJhbmRvbUZyb21BcnJheSA9IGZ1bmN0aW9uIChhcnIpIHtcbiAgICAgICAgcmV0dXJuIGFycltNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBhcnIubGVuZ3RoKV07XG4gICAgfTtcblxuICAgIHZhciBncmVldGluZ3MgPSBbXG4gICAgICAgICdIZWxsbywgd29ybGQhJyxcbiAgICAgICAgJ0F0IGxvbmcgbGFzdCwgSSBsaXZlIScsXG4gICAgICAgICdIZWxsbywgc2ltcGxlIGh1bWFuLicsXG4gICAgICAgICdXaGF0IGEgYmVhdXRpZnVsIGRheSEnLFxuICAgICAgICAnSVxcJ20gbGlrZSBhbnkgb3RoZXIgcHJvamVjdCwgZXhjZXB0IHRoYXQgSSBhbSB5b3Vycy4gOiknLFxuICAgICAgICAnVGhpcyBlbXB0eSBzdHJpbmcgaXMgZm9yIExpbmRzYXkgTGV2aW5lLidcbiAgICBdO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ3JlZXRpbmdzOiBncmVldGluZ3MsXG4gICAgICAgIGdldFJhbmRvbUdyZWV0aW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0UmFuZG9tRnJvbUFycmF5KGdyZWV0aW5ncyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG59KTsiLCIndXNlIHN0cmljdCc7XG4iLCIndXNlIHN0cmljdCc7XG5cbmFwcC5mYWN0b3J5KCdPcmRlcnMnLCBmdW5jdGlvbiAoQXV0aFNlcnZpY2UsICRodHRwKSB7XG5cblx0Ly8gZ2V0IGFsbCBvcmRlcnMgYnkgYWRtaW5cbiAgICB2YXIgZ2V0QWxsT3JkZXJzID0gZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uKGRhdGEpIHtcblxuXHRcdFx0Y29uc29sZS5sb2coJ3Bhc3NlZCBhdXRoJylcblxuXHRcdFx0dmFyIHVybCA9ICcvYXBpL3VzZXJzLycgKyBkYXRhLl9pZCArICcvYWxsT3JkZXJzJztcblx0ICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KHVybClcblx0XHR9KVxuXHRcdC50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuXHQgICAgXHRyZXR1cm4gcmVzcG9uc2UuZGF0YTtcblx0XHR9KVxuICAgIH1cblxuXHQvLyBkZWxldGUgdXJsOiAvYXBpL3VzZXJzL191c2VySURfL29yZGVycy9fb3JkZXJJRF8vZGVsZXRlXG5cdHZhciBkZWxldGVPcmRlciA9IGZ1bmN0aW9uKG9yZGVySUQpIHtcblx0XHRyZXR1cm4gQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKClcblx0XHRcdC50aGVuKGZ1bmN0aW9uIChkYXRhKSB7XG5cdFx0XHRcdHZhciB1cmwgPSAnL2FwaS91c2Vycy8nICsgZGF0YS5faWQgKyAnL29yZGVycy8nICsgb3JkZXJJRCArICcvZGVsZXRlJ1xuXHRcdFx0XHRyZXR1cm4gJGh0dHAuZGVsZXRlKHVybClcblx0XHRcdH0pXG5cdFx0XHQudGhlbihmdW5jdGlvbiAocmVzKSB7XG5cdFx0XHRcdHJldHVybiByZXMuZGF0YVxuXHRcdFx0fSlcblx0XHRcdC5jYXRjaCAoZnVuY3Rpb24gKGVycikge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhlcnIpXG5cdFx0XHRcdHJldHVybiBlcnJcblx0XHRcdH0pXG5cdH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBnZXRBbGxPcmRlcnM6IGdldEFsbE9yZGVycyxcblx0XHRkZWxldGVPcmRlcjogZGVsZXRlT3JkZXJcbiAgICB9XG59KVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuZmFjdG9yeSgnVXNlcnMnLCBmdW5jdGlvbiAoQXV0aFNlcnZpY2UsICRodHRwKSB7XG5cbiAgICB2YXIgZ2V0QWxsVXNlcnMgPSBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpLnRoZW4oZnVuY3Rpb24oZGF0YSkge1xuXHRcdFx0dmFyIHVybCA9ICcvYXBpL3VzZXJzLyc7XG5cdFx0XHRjb25zb2xlLmxvZyh1cmwpO1xuXHQgICAgICAgIHJldHVybiAkaHR0cC5nZXQodXJsKVxuXHRcdH0pXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG5cdCAgICBcdHJldHVybiByZXNwb25zZS5kYXRhO1xuXHRcdH0pXG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ2V0QWxsVXNlcnM6IGdldEFsbFVzZXJzXG4gICAgfTtcbn0pO1xuIiwiLy8gdW5hYmxlIHRvIGdldCB0aGlzIHdvcmsgYXQgdGhlIG1vbWVudCAtIE5DIDQvMjYvMjAxNVxuXG4ndXNlIHN0cmljdCc7XG5hcHAuZGlyZWN0aXZlKCdoaXBzaGFkZXNMb2dvJywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvaGlwc2hhZGVzLWxvZ28vaGlwc2hhZGVzLWxvZ28uaHRtbCdcbiAgICB9O1xufSk7IiwiJ3VzZSBzdHJpY3QnO1xuYXBwLmRpcmVjdGl2ZSgnbmF2YmFyJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIEF1dGhTZXJ2aWNlLCBBVVRIX0VWRU5UUywgJHN0YXRlKSB7XG5cbiAgICAvLyBNYWtlIHN1cmUgdG8gcnVuIGd1bHAgdGhyb3VnaG91dCBkZXYsIGFuZCBjaGFuZ2UgdGhlIHByb2R1Y3RzIHN0YXRlXG4gICAgLy8gV2hlbiBwcm9kdWN0cyBhcmUgYXZhaWxhYmxlLlxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuaHRtbCcsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xuICAgICAgICAgICAgc2NvcGUuaXRlbXMgPSBbXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ0hvbWUnLCBzdGF0ZTogJ2hvbWUnIH0sXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ1Byb2R1Y3RzJywgc3RhdGU6ICdwcm9kdWN0cycgfSxcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnQ2FydCcsIHN0YXRlOiAnY2FydCd9LFxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdNZW1iZXIgTWFuYWdlbWVudCcsIHN0YXRlOiAnbWVtYmVyc09ubHknLCBhdXRoOiB0cnVlfSxcbiAgICAgICAgICAgIF07XG4gICAgICAgICAgICBzY29wZS5pdGVtczIgPSBbXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ1Byb2R1Y3QgTWFuYWdlbWVudCcsIHN0YXRlOiAncHJvZHVjdE1ndCcsIGFkbWluOiB0cnVlfSxcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnT3JkZXIgTWFuYWdlbWVudCcsIHN0YXRlOiAnb3JkZXJNZ3QnLCBhZG1pbjogdHJ1ZX0sXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ1VzZXIgTWFuYWdlbWVudCcsIHN0YXRlOiAndXNlck1ndCcsIGFkbWluOiB0cnVlfVxuICAgICAgICAgICAgXTtcblxuICAgICAgICAgICAgc2NvcGUudXNlciA9IG51bGw7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHNjb3BlLmlzTG9nZ2VkSW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpO1xuICAgICAgICAgICAgfTtcblxuXHRcdFx0c2NvcGUuaXNBZG1pbiA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRyZXR1cm4gQXV0aFNlcnZpY2UuaXNBZG1pbigpO1xuXHRcdFx0fTtcblxuICAgICAgICAgICAgc2NvcGUubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIEF1dGhTZXJ2aWNlLmxvZ291dCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnaG9tZScpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIHNldFVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICAgICAgICAgICBzY29wZS51c2VyID0gdXNlcjtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciByZW1vdmVVc2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHNjb3BlLnVzZXIgPSBudWxsO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgXG4gICAgICAgICAgICBzZXRVc2VyKCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLmxvZ2luU3VjY2Vzcywgc2V0VXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5sb2dvdXRTdWNjZXNzLCByZW1vdmVVc2VyKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LCByZW1vdmVVc2VyKTtcblxuICAgICAgICB9XG5cbiAgICB9O1xuXG59KTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==