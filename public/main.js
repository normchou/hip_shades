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
        if (currentOrder) {
            $scope.orderData = currentOrder.products;
            $scope.currentOrder = currentOrder;
            $scope.priceSum = CartFactory.priceSum(currentOrder);
            $scope.itemCount = CartFactory.itemCount(currentOrder);
            $scope.salesTax = $scope.priceSum > 0 ? 28.5 : 0;
            $scope.shippingHandling = $scope.priceSum > 0 ? 20 : 0;
            $scope.totalOrder = $scope.priceSum + $scope.salesTax + $scope.shippingHandling;
        }
    };

    $scope.initializeCart();
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
    });

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

app.factory('SearchFactory', function ($http) {

    return {

        searchProducts: function searchProducts() {
            return $http.get('/api/products/search').then(function (res) {
                return res.data;
            })['catch'](function (err) {
                console.error(err);
                return err;
            });
        }

    };
});
'use strict';

//The Config below defines the /search state, which will
//allow the user to search for products.

app.config(function ($stateProvider) {
    $stateProvider.state('search', {
        url: '/search',
        templateUrl: 'js/search/search.html',
        controller: 'SearchController'
    });
});

app.controller('SearchController', function ($scope, SearchFactory) {
    $scope.criteriaObject = {
        title: '',
        description: '',
        price: 0,
        categories: []
    };

    $scope.searchResults;

    $scope.initializeSearch = function (criteriaObject) {
        SearchFactory.searchProducts(criteriaObject).then(function (products) {
            $scope.searchResults = products;
        })['catch'](function (err) {
            console.error(err);
            return err;
        });
    };

    $scope.initializeSearch(criteriaObject);
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

'use strict';
app.directive('navbar', function ($rootScope, AuthService, AUTH_EVENTS, $state) {

    // Make sure to run gulp throughout dev, and change the products state
    // When products are available.

    return {
        restrict: 'E',
        scope: {},
        templateUrl: 'js/common/directives/navbar/navbar.html',
        link: function link(scope) {
            scope.items = [{ label: 'Home', state: 'home' }, { label: 'Products', state: 'products' }, { label: 'Cart', state: 'cart' }, { label: 'Product Management', state: 'productMgt', admin: true }, { label: 'Order Management', state: 'orderMgt', admin: true }, { label: 'User Management', state: 'userMgt', admin: true }];

            scope.user = null;
            scope.criteriaObject = {};

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

            scope.search = function (title) {
                $state.go('search');
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

// unable to get this work at the moment - NC 4/26/2015

'use strict';
app.directive('hipshadesLogo', function () {
    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/hipshades-logo/hipshades-logo.html'
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNhcnQvQ2FydEZhY3RvcnkuanMiLCJjYXJ0L2NhcnQuanMiLCJmc2EvZnNhLXByZS1idWlsdC5qcyIsImhvbWUvaG9tZS5qcyIsImxvZ2luL2xvZ2luLmpzIiwibWVtYmVycy1vbmx5L21lbWJlcnMtb25seS5qcyIsIm9yZGVyLW1hbmFnZW1lbnQvb3JkZXItbWFuYWdlbWVudC5qcyIsInByb2R1Y3QtbWFuYWdlbWVudC9wcm9kdWN0LW1hbmFnZW1lbnQuanMiLCJwcm9kdWN0cy9wcm9kdWN0cy5qcyIsInNlYXJjaC9TZWFyY2hGYWN0b3J5LmpzIiwic2VhcmNoL3NlYXJjaC5qcyIsInNpZ251cC9TaWdudXBGYWN0b3J5LmpzIiwic2lnbnVwL3NpZ251cC5qcyIsInVzZXItbWFuYWdlbWVudC91c2VyLW1hbmFnZW1lbnQuanMiLCJjb21tb24vZmFjdG9yaWVzL1JhbmRvbUdyZWV0aW5ncy5qcyIsImNvbW1vbi9mYWN0b3JpZXMvU29ja2V0LmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9nZXRPcmRlcnMuanMiLCJjb21tb24vZmFjdG9yaWVzL2dldFVzZXJEYXRhLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvbmF2YmFyL25hdmJhci5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL2hpcHNoYWRlcy1sb2dvL2hpcHNoYWRlcy1sb2dvLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQUEsQ0FBQTtBQUNBLElBQUEsR0FBQSxHQUFBLE9BQUEsQ0FBQSxNQUFBLENBQUEsdUJBQUEsRUFBQSxDQUFBLFdBQUEsRUFBQSxhQUFBLENBQUEsQ0FBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxrQkFBQSxFQUFBLGlCQUFBLEVBQUE7O0FBRUEscUJBQUEsQ0FBQSxTQUFBLENBQUEsSUFBQSxDQUFBLENBQUE7O0FBRUEsc0JBQUEsQ0FBQSxTQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7Q0FDQSxDQUFBLENBQUE7OztBQUlBLEdBQUEsQ0FBQSxHQUFBLENBQUEsVUFBQSxVQUFBLEVBQUEsV0FBQSxFQUFBLE1BQUEsRUFBQTs7O0FBR0EsUUFBQSw0QkFBQSxHQUFBLHNDQUFBLEtBQUEsRUFBQTtBQUNBLGVBQUEsS0FBQSxDQUFBLElBQUEsSUFBQSxLQUFBLENBQUEsSUFBQSxDQUFBLFlBQUEsQ0FBQTtLQUNBLENBQUE7Ozs7QUFJQSxjQUFBLENBQUEsR0FBQSxDQUFBLG1CQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUEsT0FBQSxFQUFBLFFBQUEsRUFBQTs7QUFFQSxZQUFBLENBQUEsNEJBQUEsQ0FBQSxPQUFBLENBQUEsRUFBQTs7O0FBR0EsbUJBQUE7U0FDQTs7QUFFQSxZQUFBLFdBQUEsQ0FBQSxlQUFBLEVBQUEsRUFBQTs7O0FBR0EsbUJBQUE7U0FDQTs7O0FBR0EsYUFBQSxDQUFBLGNBQUEsRUFBQSxDQUFBOztBQUVBLG1CQUFBLENBQUEsZUFBQSxFQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsSUFBQSxFQUFBOzs7O0FBSUEsZ0JBQUEsSUFBQSxFQUFBO0FBQ0Esc0JBQUEsQ0FBQSxFQUFBLENBQUEsT0FBQSxDQUFBLElBQUEsRUFBQSxRQUFBLENBQUEsQ0FBQTthQUNBLE1BQUE7QUFDQSxzQkFBQSxDQUFBLEVBQUEsQ0FBQSxPQUFBLENBQUEsQ0FBQTthQUNBO1NBQ0EsQ0FBQSxDQUFBO0tBRUEsQ0FBQSxDQUFBO0NBRUEsQ0FBQSxDQUFBO0FDbkRBLEdBQUEsQ0FBQSxPQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBOztBQUVBLFdBQUE7O0FBRUEsc0JBQUEsRUFBQSwwQkFBQTs7O0FBR0EsbUJBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSx5QkFBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0Esb0JBQUEsR0FBQSxDQUFBLElBQUEsRUFDQSxPQUFBLEdBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQSxDQUFBLENBQUE7QUFDQSxzQkFBQSxHQUFBLENBQUE7YUFDQSxDQUFBLFNBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLHVCQUFBLENBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBO0FBQ0EsdUJBQUEsR0FBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7O0FBRUEsMkJBQUEsRUFBQSw2QkFBQSxNQUFBLEVBQUEsT0FBQSxFQUFBLFNBQUEsRUFBQTtBQUNBLG1CQUFBLEtBQUEsVUFBQSxDQUFBLGFBQUEsR0FBQSxNQUFBLEdBQUEsVUFBQSxHQUFBLE9BQUEsR0FBQSxZQUFBLEdBQUEsU0FBQSxDQUFBLENBQ0EsSUFBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsdUJBQUEsR0FBQSxDQUFBLElBQUEsQ0FBQTthQUNBLENBQUEsU0FBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsdUJBQUEsQ0FBQSxLQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7QUFDQSx1QkFBQSxHQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FFQTs7QUFFQSxnQkFBQSxFQUFBLGtCQUFBLFlBQUEsRUFBQTtBQUNBLGdCQUFBLEtBQUEsR0FBQSxDQUFBLENBQUE7O0FBRUEsd0JBQUEsQ0FBQSxRQUFBLENBQUEsT0FBQSxDQUFBLFVBQUEsSUFBQSxFQUFBO0FBQ0EscUJBQUEsSUFBQSxJQUFBLENBQUEsRUFBQSxDQUFBLEtBQUEsR0FBQSxJQUFBLENBQUEsUUFBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBOztBQUVBLG1CQUFBLEtBQUEsQ0FBQTtTQUNBOztBQUVBLGlCQUFBLEVBQUEsbUJBQUEsWUFBQSxFQUFBO0FBQ0EsZ0JBQUEsS0FBQSxHQUFBLENBQUEsQ0FBQTs7QUFFQSx3QkFBQSxDQUFBLFFBQUEsQ0FBQSxPQUFBLENBQUEsVUFBQSxJQUFBLEVBQUE7QUFDQSxxQkFBQSxJQUFBLElBQUEsQ0FBQSxRQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7O0FBRUEsbUJBQUEsS0FBQSxDQUFBO1NBQ0E7O0FBRUEsaUJBQUEsRUFBQSxtQkFBQSxNQUFBLEVBQUEsT0FBQSxFQUFBLFlBQUEsRUFBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxJQUFBLENBQUEsYUFBQSxHQUFBLE1BQUEsR0FBQSxVQUFBLEdBQUEsT0FBQSxFQUFBLFlBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLHVCQUFBLEdBQUEsQ0FBQSxJQUFBLENBQUE7YUFDQSxDQUFBLFNBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLHVCQUFBLENBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBO0FBQ0EsdUJBQUEsR0FBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7O0tBRUEsQ0FBQTtDQUVBLENBQUEsQ0FBQTtBQzNEQSxZQUFBLENBQUE7Ozs7O0FBS0EsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTtBQUNBLGtCQUFBLENBQ0EsS0FBQSxDQUFBLE1BQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxPQUFBO0FBQ0EsbUJBQUEsRUFBQSxtQkFBQTtBQUNBLGtCQUFBLEVBQUEsZ0JBQUE7S0FDQSxDQUFBLENBQUE7Q0FDQSxDQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFVBQUEsQ0FBQSxnQkFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLFdBQUEsRUFBQTs7O0FBR0EsVUFBQSxDQUFBLFVBQUEsR0FBQSxDQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQSxDQUFBLENBQUE7O0FBRUEsVUFBQSxDQUFBLGNBQUEsR0FBQSxZQUFBO0FBQ0EsbUJBQUEsQ0FBQSxjQUFBLEVBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxZQUFBLEVBQUE7O0FBRUEsZ0JBQUEsWUFBQSxLQUFBLFdBQUEsRUFBQTtBQUNBLHVCQUFBLENBQUEsR0FBQSxDQUFBLGlCQUFBLENBQUEsQ0FBQTthQUNBLE1BQUE7QUFDQSxzQkFBQSxDQUFBLGVBQUEsQ0FBQSxZQUFBLENBQUEsQ0FBQTthQUNBO1NBQ0EsQ0FBQSxTQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSxtQkFBQSxDQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQTtBQUNBLG1CQUFBLEdBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLGFBQUEsR0FBQSxVQUFBLE9BQUEsRUFBQTs7QUFFQSxtQkFBQSxDQUFBLG1CQUFBLENBQUEsTUFBQSxDQUFBLFlBQUEsQ0FBQSxPQUFBLEVBQUEsTUFBQSxDQUFBLFlBQUEsQ0FBQSxHQUFBLEVBQUEsT0FBQSxDQUFBLEVBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxlQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLGVBQUEsQ0FBQSxlQUFBLENBQUEsQ0FBQTtTQUNBLENBQUEsU0FBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsbUJBQUEsQ0FBQSxLQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7QUFDQSxtQkFBQSxHQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxZQUFBLEdBQUEsWUFBQTtBQUNBLG1CQUFBLENBQUEsU0FBQSxDQUFBLE1BQUEsQ0FBQSxZQUFBLENBQUEsT0FBQSxFQUFBLE1BQUEsQ0FBQSxZQUFBLENBQUEsR0FBQSxFQUFBLE1BQUEsQ0FBQSxZQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxlQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLGVBQUEsQ0FBQSxlQUFBLENBQUEsQ0FBQTtTQUNBLENBQUEsU0FBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsbUJBQUEsQ0FBQSxLQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7QUFDQSxtQkFBQSxHQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxlQUFBLEdBQUEsVUFBQSxZQUFBLEVBQUE7QUFDQSxZQUFBLFlBQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsU0FBQSxHQUFBLFlBQUEsQ0FBQSxRQUFBLENBQUE7QUFDQSxrQkFBQSxDQUFBLFlBQUEsR0FBQSxZQUFBLENBQUE7QUFDQSxrQkFBQSxDQUFBLFFBQUEsR0FBQSxXQUFBLENBQUEsUUFBQSxDQUFBLFlBQUEsQ0FBQSxDQUFBO0FBQ0Esa0JBQUEsQ0FBQSxTQUFBLEdBQUEsV0FBQSxDQUFBLFNBQUEsQ0FBQSxZQUFBLENBQUEsQ0FBQTtBQUNBLGtCQUFBLENBQUEsUUFBQSxHQUFBLE1BQUEsQ0FBQSxRQUFBLEdBQUEsQ0FBQSxHQUFBLElBQUEsR0FBQSxDQUFBLENBQUE7QUFDQSxrQkFBQSxDQUFBLGdCQUFBLEdBQUEsTUFBQSxDQUFBLFFBQUEsR0FBQSxDQUFBLEdBQUEsRUFBQSxHQUFBLENBQUEsQ0FBQTtBQUNBLGtCQUFBLENBQUEsVUFBQSxHQUFBLE1BQUEsQ0FBQSxRQUFBLEdBQUEsTUFBQSxDQUFBLFFBQUEsR0FBQSxNQUFBLENBQUEsZ0JBQUEsQ0FBQTtTQUNBO0tBQ0EsQ0FBQTs7QUFFQSxVQUFBLENBQUEsY0FBQSxFQUFBLENBQUE7Q0FDQSxDQUFBLENBQUE7QUNqRUEsQ0FBQSxZQUFBOztBQUVBLGdCQUFBLENBQUE7OztBQUdBLFFBQUEsQ0FBQSxNQUFBLENBQUEsT0FBQSxFQUFBLE1BQUEsSUFBQSxLQUFBLENBQUEsd0JBQUEsQ0FBQSxDQUFBOztBQUVBLFFBQUEsR0FBQSxHQUFBLE9BQUEsQ0FBQSxNQUFBLENBQUEsYUFBQSxFQUFBLEVBQUEsQ0FBQSxDQUFBOztBQUVBLE9BQUEsQ0FBQSxPQUFBLENBQUEsUUFBQSxFQUFBLFVBQUEsU0FBQSxFQUFBOztBQUVBLFlBQUEsQ0FBQSxNQUFBLENBQUEsRUFBQSxFQUFBLE1BQUEsSUFBQSxLQUFBLENBQUEsc0JBQUEsQ0FBQSxDQUFBOztBQUVBLFlBQUEsTUFBQSxDQUFBOztBQUVBLFlBQUEsU0FBQSxDQUFBLE1BQUEsRUFBQTtBQUNBLGtCQUFBLEdBQUEsRUFBQSxDQUFBLHVCQUFBLENBQUEsQ0FBQTtTQUNBLE1BQUE7QUFDQSxrQkFBQSxHQUFBLEVBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQTtTQUNBOztBQUVBLGVBQUEsTUFBQSxDQUFBO0tBRUEsQ0FBQSxDQUFBOzs7OztBQUtBLE9BQUEsQ0FBQSxRQUFBLENBQUEsYUFBQSxFQUFBO0FBQ0Esb0JBQUEsRUFBQSxvQkFBQTtBQUNBLG1CQUFBLEVBQUEsbUJBQUE7QUFDQSxxQkFBQSxFQUFBLHFCQUFBO0FBQ0Esc0JBQUEsRUFBQSxzQkFBQTtBQUNBLHdCQUFBLEVBQUEsd0JBQUE7QUFDQSxxQkFBQSxFQUFBLHFCQUFBO0tBQ0EsQ0FBQSxDQUFBOztBQUVBLE9BQUEsQ0FBQSxPQUFBLENBQUEsaUJBQUEsRUFBQSxVQUFBLFVBQUEsRUFBQSxFQUFBLEVBQUEsV0FBQSxFQUFBO0FBQ0EsWUFBQSxVQUFBLEdBQUE7QUFDQSxlQUFBLEVBQUEsV0FBQSxDQUFBLGdCQUFBO0FBQ0EsZUFBQSxFQUFBLFdBQUEsQ0FBQSxhQUFBO0FBQ0EsZUFBQSxFQUFBLFdBQUEsQ0FBQSxjQUFBO0FBQ0EsZUFBQSxFQUFBLFdBQUEsQ0FBQSxjQUFBO1NBQ0EsQ0FBQTtBQUNBLGVBQUE7QUFDQSx5QkFBQSxFQUFBLHVCQUFBLFFBQUEsRUFBQTtBQUNBLDBCQUFBLENBQUEsVUFBQSxDQUFBLFVBQUEsQ0FBQSxRQUFBLENBQUEsTUFBQSxDQUFBLEVBQUEsUUFBQSxDQUFBLENBQUE7QUFDQSx1QkFBQSxFQUFBLENBQUEsTUFBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBO2FBQ0E7U0FDQSxDQUFBO0tBQ0EsQ0FBQSxDQUFBOztBQUVBLE9BQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxhQUFBLEVBQUE7QUFDQSxxQkFBQSxDQUFBLFlBQUEsQ0FBQSxJQUFBLENBQUEsQ0FDQSxXQUFBLEVBQ0EsVUFBQSxTQUFBLEVBQUE7QUFDQSxtQkFBQSxTQUFBLENBQUEsR0FBQSxDQUFBLGlCQUFBLENBQUEsQ0FBQTtTQUNBLENBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQSxDQUFBOztBQUVBLE9BQUEsQ0FBQSxPQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBLE9BQUEsRUFBQSxVQUFBLEVBQUEsV0FBQSxFQUFBLEVBQUEsRUFBQTs7OztBQUlBLFlBQUEsQ0FBQSxlQUFBLEdBQUEsWUFBQTtBQUNBLG1CQUFBLENBQUEsQ0FBQSxPQUFBLENBQUEsSUFBQSxDQUFBO1NBQ0EsQ0FBQTs7QUFFQSxZQUFBLENBQUEsZUFBQSxHQUFBLFlBQUE7Ozs7O0FBS0EsZ0JBQUEsSUFBQSxDQUFBLGVBQUEsRUFBQSxFQUFBO0FBQ0EsdUJBQUEsRUFBQSxDQUFBLElBQUEsQ0FBQSxPQUFBLENBQUEsSUFBQSxDQUFBLENBQUE7YUFDQTs7Ozs7QUFLQSxtQkFBQSxLQUFBLENBQUEsR0FBQSxDQUFBLFVBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxpQkFBQSxDQUFBLFNBQUEsQ0FBQSxZQUFBO0FBQ0EsdUJBQUEsSUFBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBRUEsQ0FBQTs7QUFFQSxZQUFBLENBQUEsT0FBQSxHQUFBLFlBQUE7QUFDQSxnQkFBQSxJQUFBLENBQUEsZUFBQSxFQUFBLEVBQ0EsT0FBQSxDQUFBLENBQUEsT0FBQSxDQUFBLElBQUEsQ0FBQSxLQUFBLENBQUEsS0FFQSxPQUFBLEtBQUEsQ0FBQTtTQUNBLENBQUE7O0FBRUEsWUFBQSxDQUFBLEtBQUEsR0FBQSxVQUFBLFdBQUEsRUFBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxJQUFBLENBQUEsUUFBQSxFQUFBLFdBQUEsQ0FBQSxDQUNBLElBQUEsQ0FBQSxpQkFBQSxDQUFBLFNBQ0EsQ0FBQSxVQUFBLFFBQUEsRUFBQTtBQUNBLHVCQUFBLEVBQUEsQ0FBQSxNQUFBLENBQUEsRUFBQSxPQUFBLEVBQUEsNEJBQUEsRUFBQSxDQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FDQSxDQUFBOztBQUVBLFlBQUEsQ0FBQSxNQUFBLEdBQUEsWUFBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsU0FBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFlBQUE7QUFDQSx1QkFBQSxDQUFBLE9BQUEsRUFBQSxDQUFBO0FBQ0EsMEJBQUEsQ0FBQSxVQUFBLENBQUEsV0FBQSxDQUFBLGFBQUEsQ0FBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0EsQ0FBQTs7QUFFQSxpQkFBQSxpQkFBQSxDQUFBLFFBQUEsRUFBQTtBQUNBLGdCQUFBLElBQUEsR0FBQSxRQUFBLENBQUEsSUFBQSxDQUFBO0FBQ0EsbUJBQUEsQ0FBQSxNQUFBLENBQUEsSUFBQSxDQUFBLEVBQUEsRUFBQSxJQUFBLENBQUEsSUFBQSxDQUFBLENBQUE7QUFDQSxzQkFBQSxDQUFBLFVBQUEsQ0FBQSxXQUFBLENBQUEsWUFBQSxDQUFBLENBQUE7QUFDQSxtQkFBQSxJQUFBLENBQUEsSUFBQSxDQUFBO1NBQ0EsQ0FBQTtLQUVBLENBQUEsQ0FBQTs7QUFFQSxPQUFBLENBQUEsT0FBQSxDQUFBLFNBQUEsRUFBQSxVQUFBLFVBQUEsRUFBQSxXQUFBLEVBQUE7O0FBRUEsWUFBQSxJQUFBLEdBQUEsSUFBQSxDQUFBOztBQUVBLGtCQUFBLENBQUEsR0FBQSxDQUFBLFdBQUEsQ0FBQSxnQkFBQSxFQUFBLFlBQUE7QUFDQSxnQkFBQSxDQUFBLE9BQUEsRUFBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBOztBQUVBLGtCQUFBLENBQUEsR0FBQSxDQUFBLFdBQUEsQ0FBQSxjQUFBLEVBQUEsWUFBQTtBQUNBLGdCQUFBLENBQUEsT0FBQSxFQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7O0FBRUEsWUFBQSxDQUFBLEVBQUEsR0FBQSxJQUFBLENBQUE7QUFDQSxZQUFBLENBQUEsSUFBQSxHQUFBLElBQUEsQ0FBQTs7QUFFQSxZQUFBLENBQUEsTUFBQSxHQUFBLFVBQUEsU0FBQSxFQUFBLElBQUEsRUFBQTtBQUNBLGdCQUFBLENBQUEsRUFBQSxHQUFBLFNBQUEsQ0FBQTtBQUNBLGdCQUFBLENBQUEsSUFBQSxHQUFBLElBQUEsQ0FBQTtTQUNBLENBQUE7O0FBRUEsWUFBQSxDQUFBLE9BQUEsR0FBQSxZQUFBO0FBQ0EsZ0JBQUEsQ0FBQSxFQUFBLEdBQUEsSUFBQSxDQUFBO0FBQ0EsZ0JBQUEsQ0FBQSxJQUFBLEdBQUEsSUFBQSxDQUFBO1NBQ0EsQ0FBQTtLQUVBLENBQUEsQ0FBQTtDQUVBLENBQUEsRUFBQSxDQUFBOztBQ2pKQSxZQUFBLENBQUE7QUFDQSxHQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FDQSxLQUFBLENBQUEsTUFBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLEdBQUE7QUFDQSxtQkFBQSxFQUFBLG1CQUFBLEVBQ0EsQ0FBQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBOztBQ1BBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7O0FBRUEsa0JBQUEsQ0FBQSxLQUFBLENBQUEsT0FBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLFFBQUE7QUFDQSxtQkFBQSxFQUFBLHFCQUFBO0FBQ0Esa0JBQUEsRUFBQSxXQUFBO0tBQ0EsQ0FBQSxDQUFBO0NBRUEsQ0FBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxVQUFBLENBQUEsV0FBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLFdBQUEsRUFBQSxNQUFBLEVBQUE7O0FBRUEsVUFBQSxDQUFBLEtBQUEsR0FBQSxFQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsS0FBQSxHQUFBLElBQUEsQ0FBQTs7QUFFQSxVQUFBLENBQUEsU0FBQSxHQUFBLFVBQUEsU0FBQSxFQUFBOztBQUVBLGNBQUEsQ0FBQSxLQUFBLEdBQUEsSUFBQSxDQUFBOztBQUVBLG1CQUFBLENBQUEsS0FBQSxDQUFBLFNBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxZQUFBO0FBQ0Esa0JBQUEsQ0FBQSxFQUFBLENBQUEsTUFBQSxDQUFBLENBQUE7U0FDQSxDQUFBLFNBQUEsQ0FBQSxZQUFBO0FBQ0Esa0JBQUEsQ0FBQSxLQUFBLEdBQUEsNEJBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUVBLENBQUE7Q0FFQSxDQUFBLENBQUE7QUMzQkEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTs7QUFFQSxrQkFBQSxDQUFBLEtBQUEsQ0FBQSxhQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsZUFBQTtBQUNBLG1CQUFBLEVBQUEsbUNBQUE7QUFDQSxrQkFBQSxFQUFBLGtCQUFBO0FBQ0EsZUFBQSxFQUFBO0FBQ0Esa0JBQUEsRUFBQSxnQkFBQSxNQUFBLEVBQUE7QUFDQSx1QkFBQSxNQUFBLENBQUEsWUFBQSxFQUFBLENBQUE7YUFDQTtTQUNBOzs7QUFHQSxZQUFBLEVBQUE7QUFDQSx3QkFBQSxFQUFBLElBQUE7U0FDQTtLQUNBLENBQUEsQ0FBQTtDQUVBLENBQUEsQ0FBQTs7QUFHQSxHQUFBLENBQUEsVUFBQSxDQUFBLGtCQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsS0FBQSxFQUFBLFdBQUEsRUFBQSxNQUFBLEVBQUEsV0FBQSxFQUFBOztBQUVBLGVBQUEsQ0FBQSxRQUFBLEVBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxjQUFBLENBQUEsS0FBQSxHQUFBLEtBQUEsQ0FBQTtLQUNBLENBQUEsQ0FBQTs7QUFFQSxVQUFBLENBQUEsS0FBQSxHQUFBLE1BQUEsQ0FBQTs7QUFHQSxXQUFBLENBQUEsR0FBQSxDQUFBLG9CQUFBLEVBQUEsV0FBQSxDQUFBLGVBQUEsRUFBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLElBQUEsRUFBQTtBQUFBLGVBQUEsSUFBQSxDQUFBO0tBQUEsQ0FBQSxDQUFBLENBQUE7Q0FVQSxDQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLE9BQUEsQ0FBQSxhQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUE7O0FBRUEsUUFBQSxRQUFBLEdBQUEsb0JBQUE7QUFDQSxlQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsMkJBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLFFBQUEsRUFBQTtBQUNBLG1CQUFBLFFBQUEsQ0FBQSxJQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFdBQUE7QUFDQSxnQkFBQSxFQUFBLFFBQUE7S0FDQSxDQUFBO0NBRUEsQ0FBQSxDQUFBO0FDdERBLFlBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FDQSxLQUFBLENBQUEsVUFBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLGtCQUFBO0FBQ0EsbUJBQUEsRUFBQSwyQ0FBQTtBQUNBLGtCQUFBLEVBQUEsMkJBQUE7QUFDQSxlQUFBLEVBQUE7QUFDQSxrQkFBQSxFQUFBLGdCQUFBLE1BQUEsRUFBQTtBQUNBLHVCQUFBLE1BQUEsQ0FBQSxZQUFBLEVBQUEsQ0FBQTthQUNBO0FBQ0EsdUJBQUEsRUFBQSxxQkFBQSxNQUFBLEVBQUE7QUFDQSx1QkFBQSxNQUFBLENBQUEsV0FBQSxDQUFBO2FBQ0E7U0FDQTtLQUNBLENBQUEsQ0FDQSxLQUFBLENBQUEsZUFBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLFdBQUE7QUFDQSxtQkFBQSxFQUFBLGlEQUFBO0FBQ0Esa0JBQUEsRUFBQSwyQkFBQTtLQUNBLENBQUEsQ0FBQTtDQUNBLENBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsVUFBQSxDQUFBLDJCQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsV0FBQSxFQUFBLFlBQUEsRUFBQSxLQUFBLEVBQUEsTUFBQSxFQUFBLFdBQUEsRUFBQTtBQUNBLFVBQUEsQ0FBQSxNQUFBLEdBQUEsTUFBQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxXQUFBLEdBQUEsVUFBQSxPQUFBLEVBQUE7O0FBRUEsbUJBQUEsQ0FBQSxPQUFBLENBQUEsQ0FBQTs7QUFFQSxjQUFBLENBQUEsTUFBQSxDQUFBLE9BQUEsQ0FBQSxVQUFBLEtBQUEsRUFBQSxHQUFBLEVBQUE7QUFDQSxnQkFBQSxLQUFBLENBQUEsR0FBQSxLQUFBLE9BQUEsRUFBQTtBQUNBLHVCQUFBLE1BQUEsQ0FBQSxNQUFBLENBQUEsTUFBQSxDQUFBLEdBQUEsRUFBQSxDQUFBLENBQUEsQ0FBQTthQUNBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTtDQUNBLENBQUEsQ0FBQTs7QUNyQ0EsWUFBQSxDQUFBO0FBQ0EsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTtBQUNBLGtCQUFBLENBQ0EsS0FBQSxDQUFBLFlBQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxxQkFBQTtBQUNBLG1CQUFBLEVBQUEsK0NBQUE7QUFDQSxrQkFBQSxFQUFBLDZCQUFBO0tBQ0EsQ0FBQSxDQUNBLEtBQUEsQ0FBQSxpQkFBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLGFBQUE7QUFDQSxtQkFBQSxFQUFBLG9EQUFBO0FBQ0Esa0JBQUEsRUFBQSw2QkFBQTtLQUNBLENBQUEsQ0FBQTtDQUNBLENBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsVUFBQSxDQUFBLDZCQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsWUFBQSxFQUFBLEtBQUEsRUFBQTs7QUFHQSxTQUFBLENBQUEsR0FBQSxDQUFBLGVBQUEsQ0FBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLFFBQUEsRUFBQTtBQUNBLGNBQUEsQ0FBQSxRQUFBLEdBQUEsUUFBQSxDQUFBLElBQUEsQ0FBQTtBQUNBLGVBQUEsTUFBQSxDQUFBLFFBQUEsQ0FBQTtLQUNBLENBQUEsQ0FBQTs7QUFHQSxRQUFBLFlBQUEsQ0FBQSxTQUFBLEVBQUE7QUFDQSxhQUFBLENBQUEsR0FBQSxDQUFBLGdCQUFBLEdBQUEsWUFBQSxDQUFBLFNBQUEsQ0FBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLFFBQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsV0FBQSxHQUFBLFFBQUEsQ0FBQSxJQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQTs7O0FBSUEsVUFBQSxDQUFBLFdBQUEsR0FBQSxZQUFBOzs7O0FBSUEsZUFBQSxDQUFBLEdBQUEsQ0FBQSxVQUFBLENBQUEsQ0FBQTtLQUtBLENBQUE7OztBQUdBLFVBQUEsQ0FBQSxhQUFBLEdBQUEsVUFBQSxPQUFBLEVBQUE7QUFDQSxjQUFBLENBQUEsUUFBQSxDQUFBLE9BQUEsQ0FBQSxVQUFBLFlBQUEsRUFBQTtBQUNBLGdCQUFBLE9BQUEsQ0FBQSxHQUFBLEtBQUEsWUFBQSxDQUFBLEdBQUEsRUFBQTtBQUNBLG9CQUFBLEtBQUEsR0FBQSxNQUFBLENBQUEsUUFBQSxDQUFBLE9BQUEsQ0FBQSxZQUFBLENBQUEsQ0FBQTtBQUNBLHVCQUFBLE1BQUEsQ0FBQSxRQUFBLENBQUEsTUFBQSxDQUFBLEtBQUEsRUFBQSxDQUFBLENBQUEsQ0FBQTthQUNBO1NBQ0EsQ0FBQSxDQUFBOztBQUVBLGFBQUEsVUFBQSxDQUFBLGdCQUFBLEdBQUEsT0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLFFBQUEsRUFBQTtBQUNBLG1CQUFBLENBQUEsR0FBQSxDQUFBLFFBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBLENBQUE7Q0FHQSxDQUFBLENBQUE7O0FDN0RBLFlBQUEsQ0FBQTtBQUNBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUNBLEtBQUEsQ0FBQSxVQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsV0FBQTtBQUNBLG1CQUFBLEVBQUEsMkJBQUE7QUFDQSxrQkFBQSxFQUFBLG9CQUFBO0tBQ0EsQ0FBQSxDQUNBLEtBQUEsQ0FBQSxlQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsYUFBQTtBQUNBLG1CQUFBLEVBQUEsOEJBQUE7QUFDQSxrQkFBQSxFQUFBLG9CQUFBO0tBQ0EsQ0FBQSxDQUNBLEtBQUEsQ0FBQSxxQkFBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLG1CQUFBO0FBQ0EsbUJBQUEsRUFBQSxrQ0FBQTtBQUNBLGtCQUFBLEVBQUEsb0JBQUE7S0FDQSxDQUFBLENBQUE7Q0FFQSxDQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFVBQUEsQ0FBQSxvQkFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLFlBQUEsRUFBQSxLQUFBLEVBQUE7OztBQUdBLFNBQUEsQ0FBQSxHQUFBLENBQUEsZUFBQSxDQUFBLENBQ0EsSUFBQSxDQUFBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsY0FBQSxDQUFBLFFBQUEsR0FBQSxRQUFBLENBQUEsSUFBQSxDQUFBO0tBQ0EsQ0FBQSxDQUFBOztBQUVBLFFBQUEsWUFBQSxDQUFBLGVBQUEsRUFBQTs7QUFFQSxhQUFBLENBQUEsR0FBQSxDQUFBLGtCQUFBLEdBQUEsWUFBQSxDQUFBLGVBQUEsQ0FBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLFFBQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsZUFBQSxHQUFBLFFBQUEsQ0FBQSxJQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQTs7QUFFQSxRQUFBLFlBQUEsQ0FBQSxTQUFBLEVBQUE7O0FBRUEsYUFBQSxDQUFBLEdBQUEsQ0FBQSxnQkFBQSxHQUFBLFlBQUEsQ0FBQSxTQUFBLEdBQUEsVUFBQSxDQUFBLENBQ0EsSUFBQSxDQUFBLFVBQUEsUUFBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxjQUFBLEdBQUEsUUFBQSxDQUFBLElBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTs7QUFFQSxhQUFBLENBQUEsR0FBQSxDQUFBLGdCQUFBLEdBQUEsWUFBQSxDQUFBLFNBQUEsQ0FBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLFFBQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsV0FBQSxHQUFBLFFBQUEsQ0FBQSxJQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQTs7Ozs7QUFNQSxVQUFBLENBQUEsV0FBQSxHQUFBLFVBQUEsRUFBQSxFQUFBOztBQUVBLGFBQUEsQ0FBQSxJQUFBLENBQUEsZ0JBQUEsR0FBQSxFQUFBLENBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxRQUFBLEVBQUE7QUFDQSxtQkFBQSxDQUFBLEdBQUEsQ0FBQSxxQkFBQSxFQUFBLFFBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFVBQUEsR0FBQTtBQUNBLGVBQUEsRUFBQSxJQUFBO0FBQ0Esa0JBQUEsRUFBQSxZQUFBLENBQUEsU0FBQTtBQUNBLGFBQUEsRUFBQSxDQUFBO0FBQ0EsY0FBQSxFQUFBLEVBQUE7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxjQUFBLEdBQUEsS0FBQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxNQUFBLENBQUEsZ0JBQUEsRUFBQSxZQUFBO0FBQ0EsY0FBQSxDQUFBLG1CQUFBLEdBQUEsTUFBQSxDQUFBLGNBQUEsR0FBQSxXQUFBLEdBQUEsWUFBQSxDQUFBO0tBQ0EsQ0FBQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxZQUFBLEdBQUEsVUFBQSxNQUFBLEVBQUE7O0FBRUEsYUFBQSxDQUFBLElBQUEsQ0FBQSxnQkFBQSxHQUFBLFlBQUEsQ0FBQSxTQUFBLEdBQUEsVUFBQSxFQUFBLE1BQUEsQ0FBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLFFBQUEsRUFBQTtBQUNBLG1CQUFBLENBQUEsR0FBQSxDQUFBLFFBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTs7QUFFQSxjQUFBLENBQUEsVUFBQSxHQUFBO0FBQ0EsbUJBQUEsRUFBQSxJQUFBO0FBQ0Esc0JBQUEsRUFBQSxZQUFBLENBQUEsU0FBQTtBQUNBLGlCQUFBLEVBQUEsQ0FBQTtBQUNBLGtCQUFBLEVBQUEsRUFBQTtTQUNBLENBQUE7O0FBRUEsY0FBQSxDQUFBLGNBQUEsR0FBQSxLQUFBLENBQUE7S0FDQSxDQUFBO0NBRUEsQ0FBQSxDQUFBOztBQzVGQSxHQUFBLENBQUEsT0FBQSxDQUFBLGVBQUEsRUFBQSxVQUFBLEtBQUEsRUFBQTs7QUFFQSxXQUFBOztBQUVBLHNCQUFBLEVBQUEsMEJBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsR0FBQSxDQUFBLHNCQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSx1QkFBQSxHQUFBLENBQUEsSUFBQSxDQUFBO2FBQ0EsQ0FBQSxTQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSx1QkFBQSxDQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQTtBQUNBLHVCQUFBLEdBQUEsQ0FBQTthQUNBLENBQUEsQ0FBQTtTQUNBOztLQUVBLENBQUE7Q0FFQSxDQUFBLENBQUE7QUNmQSxZQUFBLENBQUE7Ozs7O0FBS0EsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTtBQUNBLGtCQUFBLENBQ0EsS0FBQSxDQUFBLFFBQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxTQUFBO0FBQ0EsbUJBQUEsRUFBQSx1QkFBQTtBQUNBLGtCQUFBLEVBQUEsa0JBQUE7S0FDQSxDQUFBLENBQUE7Q0FDQSxDQUFBLENBQUE7O0FBR0EsR0FBQSxDQUFBLFVBQUEsQ0FBQSxrQkFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLGFBQUEsRUFBQTtBQUNBLFVBQUEsQ0FBQSxjQUFBLEdBQUE7QUFDQSxhQUFBLEVBQUEsRUFBQTtBQUNBLG1CQUFBLEVBQUEsRUFBQTtBQUNBLGFBQUEsRUFBQSxDQUFBO0FBQ0Esa0JBQUEsRUFBQSxFQUFBO0tBQ0EsQ0FBQTs7QUFFQSxVQUFBLENBQUEsYUFBQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxnQkFBQSxHQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0EscUJBQUEsQ0FBQSxjQUFBLENBQUEsY0FBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsUUFBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxhQUFBLEdBQUEsUUFBQSxDQUFBO1NBQ0EsQ0FBQSxTQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSxtQkFBQSxDQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQTtBQUNBLG1CQUFBLEdBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBR0EsVUFBQSxDQUFBLGdCQUFBLENBQUEsY0FBQSxDQUFBLENBQUE7Q0FDQSxDQUFBLENBQUE7QUNwQ0EsR0FBQSxDQUFBLE9BQUEsQ0FBQSxlQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUE7O0FBRUEsV0FBQTs7QUFFQSxxQkFBQSxFQUFBLHVCQUFBLFlBQUEsRUFBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxJQUFBLENBQUEsWUFBQSxFQUFBLFlBQUEsQ0FBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLFFBQUEsRUFBQTtBQUNBLHVCQUFBLFFBQUEsQ0FBQSxJQUFBLENBQUE7YUFDQSxDQUFBLFNBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLHVCQUFBLENBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBO0FBQ0EsdUJBQUEsR0FBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7O0tBRUEsQ0FBQTtDQUVBLENBQUEsQ0FBQTtBQ2hCQSxHQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FDQSxLQUFBLENBQUEsUUFBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLFNBQUE7QUFDQSxtQkFBQSxFQUFBLHVCQUFBO0FBQ0Esa0JBQUEsRUFBQSxZQUFBO0tBQ0EsQ0FBQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxVQUFBLENBQUEsWUFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLFdBQUEsRUFBQSxNQUFBLEVBQUEsYUFBQSxFQUFBOztBQUVBLFVBQUEsQ0FBQSxLQUFBLEdBQUEsSUFBQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLE1BQUEsR0FBQSxFQUFBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFVBQUEsR0FBQSxVQUFBLE1BQUEsRUFBQTtBQUNBLGNBQUEsQ0FBQSxLQUFBLEdBQUEsSUFBQSxDQUFBOztBQUVBLHFCQUFBLENBQUEsYUFBQSxDQUFBLE1BQUEsQ0FBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLElBQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsRUFBQSxDQUFBLE1BQUEsQ0FBQSxDQUFBO0FBQ0EsbUJBQUEsV0FBQSxDQUFBLGVBQUEsRUFBQSxDQUFBO1NBQ0EsQ0FBQSxTQUNBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLEtBQUEsR0FBQSw4Q0FBQSxDQUFBO0FBQ0EsbUJBQUEsQ0FBQSxLQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBO0NBRUEsQ0FBQSxDQUFBO0FDNUJBLFlBQUEsQ0FBQTtBQUNBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUNBLEtBQUEsQ0FBQSxTQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsaUJBQUE7QUFDQSxtQkFBQSxFQUFBLHlDQUFBO0FBQ0Esa0JBQUEsRUFBQSwwQkFBQTtLQUNBLENBQUEsQ0FDQSxLQUFBLENBQUEsY0FBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLFVBQUE7QUFDQSxtQkFBQSxFQUFBLDhDQUFBO0FBQ0Esa0JBQUEsRUFBQSwwQkFBQTtLQUNBLENBQUEsQ0FBQTtDQUNBLENBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsVUFBQSxDQUFBLDBCQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsWUFBQSxFQUFBLEtBQUEsRUFBQTs7QUFFQSxTQUFBLENBQUEsR0FBQSxDQUFBLFlBQUEsQ0FBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLFFBQUEsRUFBQTtBQUNBLGNBQUEsQ0FBQSxLQUFBLEdBQUEsUUFBQSxDQUFBLElBQUEsQ0FBQTtLQUNBLENBQUEsQ0FBQTs7QUFFQSxRQUFBLENBQUEsQ0FBQSxZQUFBLENBQUEsTUFBQSxFQUFBO0FBQ0EsYUFBQSxDQUFBLEdBQUEsQ0FBQSxhQUFBLEdBQUEsWUFBQSxDQUFBLE1BQUEsQ0FBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLFFBQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsUUFBQSxHQUFBLFFBQUEsQ0FBQSxJQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQTs7O0FBR0EsVUFBQSxDQUFBLFFBQUEsR0FBQSxZQUFBO0FBQ0EsYUFBQSxDQUFBLEdBQUEsQ0FBQSxZQUFBLEVBQUEsTUFBQSxDQUFBLFFBQUEsQ0FBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLFFBQUEsRUFBQTtBQUNBLG1CQUFBLENBQUEsR0FBQSxDQUFBLFFBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBLENBQUE7OztBQUdBLFVBQUEsQ0FBQSxVQUFBLEdBQUEsVUFBQSxJQUFBLEVBQUE7QUFDQSxjQUFBLENBQUEsS0FBQSxDQUFBLE9BQUEsQ0FBQSxVQUFBLFNBQUEsRUFBQTtBQUNBLGdCQUFBLElBQUEsQ0FBQSxHQUFBLEtBQUEsU0FBQSxDQUFBLEdBQUEsRUFBQTtBQUNBLG9CQUFBLEtBQUEsR0FBQSxNQUFBLENBQUEsS0FBQSxDQUFBLE9BQUEsQ0FBQSxTQUFBLENBQUEsQ0FBQTtBQUNBLHVCQUFBLE1BQUEsQ0FBQSxLQUFBLENBQUEsTUFBQSxDQUFBLEtBQUEsRUFBQSxDQUFBLENBQUEsQ0FBQTthQUNBO1NBQ0EsQ0FBQSxDQUFBOztBQUVBLGFBQUEsVUFBQSxDQUFBLGFBQUEsR0FBQSxJQUFBLENBQUEsR0FBQSxDQUFBLENBQ0EsSUFBQSxDQUFBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsbUJBQUEsQ0FBQSxHQUFBLENBQUEsUUFBQSxDQUFBLElBQUEsQ0FBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTtDQUVBLENBQUEsQ0FBQTs7QUNwREEsWUFBQSxDQUFBO0FBQ0EsR0FBQSxDQUFBLE9BQUEsQ0FBQSxpQkFBQSxFQUFBLFlBQUE7O0FBRUEsUUFBQSxrQkFBQSxHQUFBLDRCQUFBLEdBQUEsRUFBQTtBQUNBLGVBQUEsR0FBQSxDQUFBLElBQUEsQ0FBQSxLQUFBLENBQUEsSUFBQSxDQUFBLE1BQUEsRUFBQSxHQUFBLEdBQUEsQ0FBQSxNQUFBLENBQUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxRQUFBLFNBQUEsR0FBQSxDQUNBLGVBQUEsRUFDQSx1QkFBQSxFQUNBLHNCQUFBLEVBQ0EsdUJBQUEsRUFDQSx5REFBQSxFQUNBLDBDQUFBLENBQ0EsQ0FBQTs7QUFFQSxXQUFBO0FBQ0EsaUJBQUEsRUFBQSxTQUFBO0FBQ0EseUJBQUEsRUFBQSw2QkFBQTtBQUNBLG1CQUFBLGtCQUFBLENBQUEsU0FBQSxDQUFBLENBQUE7U0FDQTtLQUNBLENBQUE7Q0FFQSxDQUFBLENBQUE7QUN2QkEsWUFBQSxDQUFBOztBQ0FBLFlBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsT0FBQSxDQUFBLFFBQUEsRUFBQSxVQUFBLFdBQUEsRUFBQSxLQUFBLEVBQUE7OztBQUdBLFFBQUEsWUFBQSxHQUFBLHdCQUFBO0FBQ0EsZUFBQSxXQUFBLENBQUEsZUFBQSxFQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsSUFBQSxFQUFBO0FBQ0EsZ0JBQUEsR0FBQSxHQUFBLGFBQUEsR0FBQSxJQUFBLENBQUEsR0FBQSxHQUFBLFlBQUEsQ0FBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7U0FDQSxDQUFBLENBQ0EsSUFBQSxDQUFBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsbUJBQUEsUUFBQSxDQUFBLElBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBLENBQUE7OztBQUdBLFFBQUEsV0FBQSxHQUFBLHFCQUFBLE9BQUEsRUFBQTtBQUNBLGVBQUEsV0FBQSxDQUFBLGVBQUEsRUFBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLElBQUEsRUFBQTtBQUNBLGdCQUFBLEdBQUEsR0FBQSxhQUFBLEdBQUEsSUFBQSxDQUFBLEdBQUEsR0FBQSxVQUFBLEdBQUEsT0FBQSxHQUFBLFNBQUEsQ0FBQTtBQUNBLG1CQUFBLEtBQUEsVUFBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBO1NBQ0EsQ0FBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLG1CQUFBLEdBQUEsQ0FBQSxJQUFBLENBQUE7U0FDQSxDQUFBLFNBQ0EsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLG1CQUFBLENBQUEsR0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBO0FBQ0EsbUJBQUEsR0FBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxXQUFBO0FBQ0Esb0JBQUEsRUFBQSxZQUFBO0FBQ0EsbUJBQUEsRUFBQSxXQUFBO0tBQ0EsQ0FBQTtDQUNBLENBQUEsQ0FBQTs7QUNuQ0EsWUFBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxPQUFBLENBQUEsT0FBQSxFQUFBLFVBQUEsV0FBQSxFQUFBLEtBQUEsRUFBQTs7QUFFQSxRQUFBLFdBQUEsR0FBQSx1QkFBQTtBQUNBLGVBQUEsV0FBQSxDQUFBLGVBQUEsRUFBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLElBQUEsRUFBQTtBQUNBLGdCQUFBLEdBQUEsR0FBQSxhQUFBLENBQUE7QUFDQSxtQkFBQSxDQUFBLEdBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7U0FDQSxDQUFBLENBQ0EsSUFBQSxDQUFBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsbUJBQUEsUUFBQSxDQUFBLElBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsV0FBQTtBQUNBLG1CQUFBLEVBQUEsV0FBQTtLQUNBLENBQUE7Q0FDQSxDQUFBLENBQUE7O0FDbEJBLFlBQUEsQ0FBQTtBQUNBLEdBQUEsQ0FBQSxTQUFBLENBQUEsUUFBQSxFQUFBLFVBQUEsVUFBQSxFQUFBLFdBQUEsRUFBQSxXQUFBLEVBQUEsTUFBQSxFQUFBOzs7OztBQUtBLFdBQUE7QUFDQSxnQkFBQSxFQUFBLEdBQUE7QUFDQSxhQUFBLEVBQUEsRUFBQTtBQUNBLG1CQUFBLEVBQUEseUNBQUE7QUFDQSxZQUFBLEVBQUEsY0FBQSxLQUFBLEVBQUE7QUFDQSxpQkFBQSxDQUFBLEtBQUEsR0FBQSxDQUNBLEVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQSxLQUFBLEVBQUEsTUFBQSxFQUFBLEVBQ0EsRUFBQSxLQUFBLEVBQUEsVUFBQSxFQUFBLEtBQUEsRUFBQSxVQUFBLEVBQUEsRUFDQSxFQUFBLEtBQUEsRUFBQSxNQUFBLEVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQSxFQUNBLEVBQUEsS0FBQSxFQUFBLG9CQUFBLEVBQUEsS0FBQSxFQUFBLFlBQUEsRUFBQSxLQUFBLEVBQUEsSUFBQSxFQUFBLEVBQ0EsRUFBQSxLQUFBLEVBQUEsa0JBQUEsRUFBQSxLQUFBLEVBQUEsVUFBQSxFQUFBLEtBQUEsRUFBQSxJQUFBLEVBQUEsRUFDQSxFQUFBLEtBQUEsRUFBQSxpQkFBQSxFQUFBLEtBQUEsRUFBQSxTQUFBLEVBQUEsS0FBQSxFQUFBLElBQUEsRUFBQSxDQUNBLENBQUE7O0FBRUEsaUJBQUEsQ0FBQSxJQUFBLEdBQUEsSUFBQSxDQUFBO0FBQ0EsaUJBQUEsQ0FBQSxjQUFBLEdBQUEsRUFBQSxDQUFBOztBQUVBLGlCQUFBLENBQUEsVUFBQSxHQUFBLFlBQUE7QUFDQSx1QkFBQSxXQUFBLENBQUEsZUFBQSxFQUFBLENBQUE7YUFDQSxDQUFBOztBQUVBLGlCQUFBLENBQUEsT0FBQSxHQUFBLFlBQUE7QUFDQSx1QkFBQSxXQUFBLENBQUEsT0FBQSxFQUFBLENBQUE7YUFDQSxDQUFBOztBQUVBLGlCQUFBLENBQUEsTUFBQSxHQUFBLFlBQUE7QUFDQSwyQkFBQSxDQUFBLE1BQUEsRUFBQSxDQUFBLElBQUEsQ0FBQSxZQUFBO0FBQ0EsMEJBQUEsQ0FBQSxFQUFBLENBQUEsTUFBQSxDQUFBLENBQUE7aUJBQ0EsQ0FBQSxDQUFBO2FBQ0EsQ0FBQTs7QUFFQSxpQkFBQSxDQUFBLE1BQUEsR0FBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLHNCQUFBLENBQUEsRUFBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBO2FBRUEsQ0FBQTs7QUFFQSxnQkFBQSxPQUFBLEdBQUEsbUJBQUE7QUFDQSwyQkFBQSxDQUFBLGVBQUEsRUFBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLElBQUEsRUFBQTtBQUNBLHlCQUFBLENBQUEsSUFBQSxHQUFBLElBQUEsQ0FBQTtpQkFDQSxDQUFBLENBQUE7YUFDQSxDQUFBOztBQUVBLGdCQUFBLFVBQUEsR0FBQSxzQkFBQTtBQUNBLHFCQUFBLENBQUEsSUFBQSxHQUFBLElBQUEsQ0FBQTthQUNBLENBQUE7O0FBR0EsbUJBQUEsRUFBQSxDQUFBOztBQUVBLHNCQUFBLENBQUEsR0FBQSxDQUFBLFdBQUEsQ0FBQSxZQUFBLEVBQUEsT0FBQSxDQUFBLENBQUE7QUFDQSxzQkFBQSxDQUFBLEdBQUEsQ0FBQSxXQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsQ0FBQSxDQUFBO0FBQ0Esc0JBQUEsQ0FBQSxHQUFBLENBQUEsV0FBQSxDQUFBLGNBQUEsRUFBQSxVQUFBLENBQUEsQ0FBQTtTQUVBOztLQUVBLENBQUE7Q0FFQSxDQUFBLENBQUE7Ozs7QUM3REEsWUFBQSxDQUFBO0FBQ0EsR0FBQSxDQUFBLFNBQUEsQ0FBQSxlQUFBLEVBQUEsWUFBQTtBQUNBLFdBQUE7QUFDQSxnQkFBQSxFQUFBLEdBQUE7QUFDQSxtQkFBQSxFQUFBLHlEQUFBO0tBQ0EsQ0FBQTtDQUNBLENBQUEsQ0FBQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xudmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdGdWxsc3RhY2tHZW5lcmF0ZWRBcHAnLCBbJ3VpLnJvdXRlcicsICdmc2FQcmVCdWlsdCddKTtcblxuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHVybFJvdXRlclByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlcikge1xuICAgIC8vIFRoaXMgdHVybnMgb2ZmIGhhc2hiYW5nIHVybHMgKC8jYWJvdXQpIGFuZCBjaGFuZ2VzIGl0IHRvIHNvbWV0aGluZyBub3JtYWwgKC9hYm91dClcbiAgICAkbG9jYXRpb25Qcm92aWRlci5odG1sNU1vZGUodHJ1ZSk7XG4gICAgLy8gSWYgd2UgZ28gdG8gYSBVUkwgdGhhdCB1aS1yb3V0ZXIgZG9lc24ndCBoYXZlIHJlZ2lzdGVyZWQsIGdvIHRvIHRoZSBcIi9cIiB1cmwuXG4gICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnLycpO1xufSk7XG5cblxuLy8gVGhpcyBhcHAucnVuIGlzIGZvciBjb250cm9sbGluZyBhY2Nlc3MgdG8gc3BlY2lmaWMgc3RhdGVzLlxuYXBwLnJ1bihmdW5jdGlvbiAoJHJvb3RTY29wZSwgQXV0aFNlcnZpY2UsICRzdGF0ZSkge1xuXG4gICAgLy8gVGhlIGdpdmVuIHN0YXRlIHJlcXVpcmVzIGFuIGF1dGhlbnRpY2F0ZWQgdXNlci5cbiAgICB2YXIgZGVzdGluYXRpb25TdGF0ZVJlcXVpcmVzQXV0aCA9IGZ1bmN0aW9uIChzdGF0ZSkge1xuICAgICAgICByZXR1cm4gc3RhdGUuZGF0YSAmJiBzdGF0ZS5kYXRhLmF1dGhlbnRpY2F0ZTtcbiAgICB9O1xuXG4gICAgLy8gJHN0YXRlQ2hhbmdlU3RhcnQgaXMgYW4gZXZlbnQgZmlyZWRcbiAgICAvLyB3aGVuZXZlciB0aGUgcHJvY2VzcyBvZiBjaGFuZ2luZyBhIHN0YXRlIGJlZ2lucy5cbiAgICAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3RhcnQnLCBmdW5jdGlvbiAoZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zKSB7XG5cbiAgICAgICAgaWYgKCFkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoKHRvU3RhdGUpKSB7XG4gICAgICAgICAgICAvLyBUaGUgZGVzdGluYXRpb24gc3RhdGUgZG9lcyBub3QgcmVxdWlyZSBhdXRoZW50aWNhdGlvblxuICAgICAgICAgICAgLy8gU2hvcnQgY2lyY3VpdCB3aXRoIHJldHVybi5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKSkge1xuICAgICAgICAgICAgLy8gVGhlIHVzZXIgaXMgYXV0aGVudGljYXRlZC5cbiAgICAgICAgICAgIC8vIFNob3J0IGNpcmN1aXQgd2l0aCByZXR1cm4uXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDYW5jZWwgbmF2aWdhdGluZyB0byBuZXcgc3RhdGUuXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICAgLy8gSWYgYSB1c2VyIGlzIHJldHJpZXZlZCwgdGhlbiByZW5hdmlnYXRlIHRvIHRoZSBkZXN0aW5hdGlvblxuICAgICAgICAgICAgLy8gKHRoZSBzZWNvbmQgdGltZSwgQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCkgd2lsbCB3b3JrKVxuICAgICAgICAgICAgLy8gb3RoZXJ3aXNlLCBpZiBubyB1c2VyIGlzIGxvZ2dlZCBpbiwgZ28gdG8gXCJsb2dpblwiIHN0YXRlLlxuICAgICAgICAgICAgaWYgKHVzZXIpIHtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28odG9TdGF0ZS5uYW1lLCB0b1BhcmFtcyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnbG9naW4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICB9KTtcblxufSk7IiwiYXBwLmZhY3RvcnkoJ0NhcnRGYWN0b3J5JywgZnVuY3Rpb24gKCRodHRwKSB7XG5cbiAgICByZXR1cm4ge1xuXG4gICAgICAgIGdldEN1cnJlbnRVc2VyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyB0ZW1wb3JhcnkgdXNlciB3b3JrZmxvd1xuICAgICAgICAgICAgLy8gZ2V0IGN1cnJlbnQgdXNlciBmcm9tIGNvb2tpZSBpZFxuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS91c2Vycy9jdXJyZW50dXNlci8nKS50aGVuKGZ1bmN0aW9uKHJlcyl7XG4gICAgICAgICAgICAgICAgaWYgKHJlcy5kYXRhKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzLmRhdGFbMF07XG4gICAgICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgIHJldHVybiBlcnI7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBkZWxldGVQcm9kdWN0SW5DYXJ0OiBmdW5jdGlvbiAodXNlcklELCBvcmRlcklELCBwcm9kdWN0SUQpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5kZWxldGUoJy9hcGkvdXNlcnMvJysgdXNlcklEICsgJy9vcmRlcnMvJyArIG9yZGVySUQgKyAnL3Byb2R1Y3RzLycgKyBwcm9kdWN0SUQpXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXMuZGF0YTtcbiAgICAgICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXJyO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH0sXG5cbiAgICAgICAgcHJpY2VTdW06IGZ1bmN0aW9uIChjdXJyZW50T3JkZXIpIHtcbiAgICAgICAgICAgIHZhciB0b3RhbCA9IDAuMDtcblxuICAgICAgICAgICAgY3VycmVudE9yZGVyLnByb2R1Y3RzLmZvckVhY2goZnVuY3Rpb24oZWxlbSkge1xuICAgICAgICAgICAgICAgIHRvdGFsICs9IGVsZW0uaWQucHJpY2UgKiBlbGVtLnF1YW50aXR5O1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiB0b3RhbDtcbiAgICAgICAgfSxcblxuICAgICAgICBpdGVtQ291bnQ6IGZ1bmN0aW9uIChjdXJyZW50T3JkZXIpIHtcbiAgICAgICAgICAgIHZhciB0b3RhbCA9IDA7XG5cbiAgICAgICAgICAgIGN1cnJlbnRPcmRlci5wcm9kdWN0cy5mb3JFYWNoKGZ1bmN0aW9uKGVsZW0pIHtcbiAgICAgICAgICAgICAgICB0b3RhbCArPSBlbGVtLnF1YW50aXR5O1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiB0b3RhbDtcbiAgICAgICAgfSxcblxuICAgICAgICBzYXZlT3JkZXI6IGZ1bmN0aW9uKHVzZXJJRCwgb3JkZXJJRCwgY3VycmVudE9yZGVyKSB7IFxuICAgICAgICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9hcGkvdXNlcnMvJysgdXNlcklEICsgJy9vcmRlcnMvJyArIG9yZGVySUQsIGN1cnJlbnRPcmRlcikudGhlbihmdW5jdGlvbihyZXMpe1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzLmRhdGE7XG4gICAgICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVycjtcbiAgICAgICAgICAgICAgICB9KTsgICAgICAgXG4gICAgICAgIH1cblxuICAgIH07XG5cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuLy9UaGUgQ29uZmlnIGJlbG93IGRlZmluZXMgdGhlIC9jYXJ0IHN0YXRlLCB3aGljaCB3aWxsXG4vL3Nob3cgYWxsIHByb2R1Y3RzIGluIHRoZSBjYXJ0LlxuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcil7XG4gICAgJHN0YXRlUHJvdmlkZXJcbiAgICAgICAgLnN0YXRlKCdjYXJ0Jywge1xuICAgICAgICAgICAgdXJsOiAnL2NhcnQnLFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jYXJ0L2NhcnQuaHRtbCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnQ2FydENvbnRyb2xsZXInXG4gICAgICAgIH0pO1xufSk7XG5cbmFwcC5jb250cm9sbGVyKCdDYXJ0Q29udHJvbGxlcicsIGZ1bmN0aW9uKCRzY29wZSwgQ2FydEZhY3RvcnkpIHtcbiAgICAvLyB0ZW1wb3JhcnkgdXNlciB3b3JrZmxvd1xuICAgIC8vIGdldCBjdXJyZW50IHVzZXIgZnJvbSBjb29raWUgaWRcbiAgICAkc2NvcGUucXVhbnRpdGllcyA9IFsxLDIsMyw0LDUsNiw3LDgsOV07XG5cbiAgICAkc2NvcGUuaW5pdGlhbGl6ZUNhcnQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgQ2FydEZhY3RvcnkuZ2V0Q3VycmVudFVzZXIoKS50aGVuKGZ1bmN0aW9uKGN1cnJlbnRPcmRlcikge1xuXG4gICAgICAgICAgICBpZiAoY3VycmVudE9yZGVyID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdub3RoaW5nIGluIGNhcnQnKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmRlZmluZUNhcnRTY29wZShjdXJyZW50T3JkZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KS5jYXRjaChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgIHJldHVybiBlcnI7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgICRzY29wZS5kZWxldGVQcm9kdWN0ID0gZnVuY3Rpb24ocHJvZHVjdCkge1xuICAgICAgLy9ERUxFVEUgL2FwaS91c2Vycy86dXNlcmlkL29yZGVycy86YW5vcmRlcmlkL3Byb2R1Y3RzLzphcHJvZHVjdElEXG4gICAgICAgIENhcnRGYWN0b3J5LmRlbGV0ZVByb2R1Y3RJbkNhcnQoJHNjb3BlLmN1cnJlbnRPcmRlci51c2VyX2lkLCAkc2NvcGUuY3VycmVudE9yZGVyLl9pZCwgcHJvZHVjdC5pZC5faWQpLnRoZW4oZnVuY3Rpb24obmV3Q3VycmVudE9yZGVyKSB7XG4gICAgICAgICAgICAkc2NvcGUuZGVmaW5lQ2FydFNjb3BlKG5ld0N1cnJlbnRPcmRlcik7XG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICAgcmV0dXJuIGVycjtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgJHNjb3BlLnNhdmVRdWFudGl0eSA9IGZ1bmN0aW9uKCkgeyBcbiAgICAgICAgQ2FydEZhY3Rvcnkuc2F2ZU9yZGVyKCRzY29wZS5jdXJyZW50T3JkZXIudXNlcl9pZCwgJHNjb3BlLmN1cnJlbnRPcmRlci5faWQsICRzY29wZS5jdXJyZW50T3JkZXIpLnRoZW4oZnVuY3Rpb24obmV3Q3VycmVudE9yZGVyKSB7XG4gICAgICAgICAgICAkc2NvcGUuZGVmaW5lQ2FydFNjb3BlKG5ld0N1cnJlbnRPcmRlcik7XG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICAgcmV0dXJuIGVycjtcbiAgICAgICAgfSk7ICBcbiAgICB9XG5cbiAgICAkc2NvcGUuZGVmaW5lQ2FydFNjb3BlID0gZnVuY3Rpb24gKGN1cnJlbnRPcmRlcikge1xuICAgICAgICBpZiAoY3VycmVudE9yZGVyKSB7XG4gICAgICAgICAgICAkc2NvcGUub3JkZXJEYXRhID0gY3VycmVudE9yZGVyLnByb2R1Y3RzO1xuICAgICAgICAgICAgJHNjb3BlLmN1cnJlbnRPcmRlciA9IGN1cnJlbnRPcmRlcjtcbiAgICAgICAgICAgICRzY29wZS5wcmljZVN1bSA9IENhcnRGYWN0b3J5LnByaWNlU3VtKGN1cnJlbnRPcmRlcik7XG4gICAgICAgICAgICAkc2NvcGUuaXRlbUNvdW50ID0gQ2FydEZhY3RvcnkuaXRlbUNvdW50KGN1cnJlbnRPcmRlcik7XG4gICAgICAgICAgICAkc2NvcGUuc2FsZXNUYXggPSAkc2NvcGUucHJpY2VTdW0gPiAwID8gMjguNTAgOiAwO1xuICAgICAgICAgICAgJHNjb3BlLnNoaXBwaW5nSGFuZGxpbmcgPSAkc2NvcGUucHJpY2VTdW0gPiAwID8gMjAuMDAgOiAwO1xuICAgICAgICAgICAgJHNjb3BlLnRvdGFsT3JkZXIgPSAkc2NvcGUucHJpY2VTdW0gKyAkc2NvcGUuc2FsZXNUYXggKyAkc2NvcGUuc2hpcHBpbmdIYW5kbGluZztcbiAgICAgICAgfVxuICAgIH1cblxuICAgICRzY29wZS5pbml0aWFsaXplQ2FydCgpO1xufSk7IiwiKGZ1bmN0aW9uICgpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8vIEhvcGUgeW91IGRpZG4ndCBmb3JnZXQgQW5ndWxhciEgRHVoLWRveS5cbiAgICBpZiAoIXdpbmRvdy5hbmd1bGFyKSB0aHJvdyBuZXcgRXJyb3IoJ0kgY2FuXFwndCBmaW5kIEFuZ3VsYXIhJyk7XG5cbiAgICB2YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ2ZzYVByZUJ1aWx0JywgW10pO1xuXG4gICAgYXBwLmZhY3RvcnkoJ1NvY2tldCcsIGZ1bmN0aW9uICgkbG9jYXRpb24pIHtcblxuICAgICAgICBpZiAoIXdpbmRvdy5pbykgdGhyb3cgbmV3IEVycm9yKCdzb2NrZXQuaW8gbm90IGZvdW5kIScpO1xuXG4gICAgICAgIHZhciBzb2NrZXQ7XG5cbiAgICAgICAgaWYgKCRsb2NhdGlvbi4kJHBvcnQpIHtcbiAgICAgICAgICAgIHNvY2tldCA9IGlvKCdodHRwOi8vbG9jYWxob3N0OjEzMzcnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNvY2tldCA9IGlvKCcvJyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc29ja2V0O1xuXG4gICAgfSk7XG5cbiAgICAvLyBBVVRIX0VWRU5UUyBpcyB1c2VkIHRocm91Z2hvdXQgb3VyIGFwcCB0b1xuICAgIC8vIGJyb2FkY2FzdCBhbmQgbGlzdGVuIGZyb20gYW5kIHRvIHRoZSAkcm9vdFNjb3BlXG4gICAgLy8gZm9yIGltcG9ydGFudCBldmVudHMgYWJvdXQgYXV0aGVudGljYXRpb24gZmxvdy5cbiAgICBhcHAuY29uc3RhbnQoJ0FVVEhfRVZFTlRTJywge1xuICAgICAgICBsb2dpblN1Y2Nlc3M6ICdhdXRoLWxvZ2luLXN1Y2Nlc3MnLFxuICAgICAgICBsb2dpbkZhaWxlZDogJ2F1dGgtbG9naW4tZmFpbGVkJyxcbiAgICAgICAgbG9nb3V0U3VjY2VzczogJ2F1dGgtbG9nb3V0LXN1Y2Nlc3MnLFxuICAgICAgICBzZXNzaW9uVGltZW91dDogJ2F1dGgtc2Vzc2lvbi10aW1lb3V0JyxcbiAgICAgICAgbm90QXV0aGVudGljYXRlZDogJ2F1dGgtbm90LWF1dGhlbnRpY2F0ZWQnLFxuICAgICAgICBub3RBdXRob3JpemVkOiAnYXV0aC1ub3QtYXV0aG9yaXplZCdcbiAgICB9KTtcblxuICAgIGFwcC5mYWN0b3J5KCdBdXRoSW50ZXJjZXB0b3InLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHEsIEFVVEhfRVZFTlRTKSB7XG4gICAgICAgIHZhciBzdGF0dXNEaWN0ID0ge1xuICAgICAgICAgICAgNDAxOiBBVVRIX0VWRU5UUy5ub3RBdXRoZW50aWNhdGVkLFxuICAgICAgICAgICAgNDAzOiBBVVRIX0VWRU5UUy5ub3RBdXRob3JpemVkLFxuICAgICAgICAgICAgNDE5OiBBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCxcbiAgICAgICAgICAgIDQ0MDogQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXRcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3BvbnNlRXJyb3I6IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChzdGF0dXNEaWN0W3Jlc3BvbnNlLnN0YXR1c10sIHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHJlc3BvbnNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9KTtcblxuICAgIGFwcC5jb25maWcoZnVuY3Rpb24gKCRodHRwUHJvdmlkZXIpIHtcbiAgICAgICAgJGh0dHBQcm92aWRlci5pbnRlcmNlcHRvcnMucHVzaChbXG4gICAgICAgICAgICAnJGluamVjdG9yJyxcbiAgICAgICAgICAgIGZ1bmN0aW9uICgkaW5qZWN0b3IpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGluamVjdG9yLmdldCgnQXV0aEludGVyY2VwdG9yJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIF0pO1xuICAgIH0pO1xuXG4gICAgYXBwLnNlcnZpY2UoJ0F1dGhTZXJ2aWNlJywgZnVuY3Rpb24gKCRodHRwLCBTZXNzaW9uLCAkcm9vdFNjb3BlLCBBVVRIX0VWRU5UUywgJHEpIHtcblxuICAgICAgICAvLyBVc2VzIHRoZSBzZXNzaW9uIGZhY3RvcnkgdG8gc2VlIGlmIGFuXG4gICAgICAgIC8vIGF1dGhlbnRpY2F0ZWQgdXNlciBpcyBjdXJyZW50bHkgcmVnaXN0ZXJlZC5cbiAgICAgICAgdGhpcy5pc0F1dGhlbnRpY2F0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gISFTZXNzaW9uLnVzZXI7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXRMb2dnZWRJblVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyBJZiBhbiBhdXRoZW50aWNhdGVkIHNlc3Npb24gZXhpc3RzLCB3ZVxuICAgICAgICAgICAgLy8gcmV0dXJuIHRoZSB1c2VyIGF0dGFjaGVkIHRvIHRoYXQgc2Vzc2lvblxuICAgICAgICAgICAgLy8gd2l0aCBhIHByb21pc2UuIFRoaXMgZW5zdXJlcyB0aGF0IHdlIGNhblxuICAgICAgICAgICAgLy8gYWx3YXlzIGludGVyZmFjZSB3aXRoIHRoaXMgbWV0aG9kIGFzeW5jaHJvbm91c2x5LlxuICAgICAgICAgICAgaWYgKHRoaXMuaXNBdXRoZW50aWNhdGVkKCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEud2hlbihTZXNzaW9uLnVzZXIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBNYWtlIHJlcXVlc3QgR0VUIC9zZXNzaW9uLlxuICAgICAgICAgICAgLy8gSWYgaXQgcmV0dXJucyBhIHVzZXIsIGNhbGwgb25TdWNjZXNzZnVsTG9naW4gd2l0aCB0aGUgcmVzcG9uc2UuXG4gICAgICAgICAgICAvLyBJZiBpdCByZXR1cm5zIGEgNDAxIHJlc3BvbnNlLCB3ZSBjYXRjaCBpdCBhbmQgaW5zdGVhZCByZXNvbHZlIHRvIG51bGwuXG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvc2Vzc2lvbicpLnRoZW4ob25TdWNjZXNzZnVsTG9naW4pLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH07XG5cblx0XHR0aGlzLmlzQWRtaW4gPSBmdW5jdGlvbigpIHtcblx0XHRcdGlmICh0aGlzLmlzQXV0aGVudGljYXRlZCgpKVxuXHRcdFx0XHRyZXR1cm4gISFTZXNzaW9uLnVzZXIuYWRtaW47XG5cdFx0XHRlbHNlXG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHR0aGlzLmxvZ2luID0gZnVuY3Rpb24gKGNyZWRlbnRpYWxzKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2xvZ2luJywgY3JlZGVudGlhbHMpXG4gICAgICAgICAgICAgICAgLnRoZW4ob25TdWNjZXNzZnVsTG9naW4pXG4gICAgICAgICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHsgbWVzc2FnZTogJ0ludmFsaWQgbG9naW4gY3JlZGVudGlhbHMuJyB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxvZ291dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9sb2dvdXQnKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBTZXNzaW9uLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoQVVUSF9FVkVOVFMubG9nb3V0U3VjY2Vzcyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICBmdW5jdGlvbiBvblN1Y2Nlc3NmdWxMb2dpbihyZXNwb25zZSkge1xuICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgU2Vzc2lvbi5jcmVhdGUoZGF0YS5pZCwgZGF0YS51c2VyKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MpO1xuICAgICAgICAgICAgcmV0dXJuIGRhdGEudXNlcjtcbiAgICAgICAgfTtcblxuICAgIH0pO1xuXG4gICAgYXBwLnNlcnZpY2UoJ1Nlc3Npb24nLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgQVVUSF9FVkVOVFMpIHtcblxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubm90QXV0aGVudGljYXRlZCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi5kZXN0cm95KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLmRlc3Ryb3koKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5pZCA9IG51bGw7XG4gICAgICAgIHRoaXMudXNlciA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5jcmVhdGUgPSBmdW5jdGlvbiAoc2Vzc2lvbklkLCB1c2VyKSB7XG4gICAgICAgICAgICB0aGlzLmlkID0gc2Vzc2lvbklkO1xuICAgICAgICAgICAgdGhpcy51c2VyID0gdXNlcjtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLmlkID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMudXNlciA9IG51bGw7XG4gICAgICAgIH07XG5cbiAgICB9KTtcblxufSkoKTtcbiIsIid1c2Ugc3RyaWN0JztcbmFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXJcbiAgICBcdC5zdGF0ZSgnaG9tZScsIHtcblx0ICAgICAgICB1cmw6ICcvJyxcblx0ICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2hvbWUvaG9tZS5odG1sJyxcblx0ICAgIH0pO1xufSk7XG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2xvZ2luJywge1xuICAgICAgICB1cmw6ICcvbG9naW4nLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2xvZ2luL2xvZ2luLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnTG9naW5DdHJsJ1xuICAgIH0pO1xuXG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0xvZ2luQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsIEF1dGhTZXJ2aWNlLCAkc3RhdGUpIHtcblxuICAgICRzY29wZS5sb2dpbiA9IHt9O1xuICAgICRzY29wZS5lcnJvciA9IG51bGw7XG5cbiAgICAkc2NvcGUuc2VuZExvZ2luID0gZnVuY3Rpb24gKGxvZ2luSW5mbykge1xuXG4gICAgICAgICRzY29wZS5lcnJvciA9IG51bGw7XG5cbiAgICAgICAgQXV0aFNlcnZpY2UubG9naW4obG9naW5JbmZvKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzdGF0ZS5nbygnaG9tZScpO1xuICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuZXJyb3IgPSAnSW52YWxpZCBsb2dpbiBjcmVkZW50aWFscy4nO1xuICAgICAgICB9KTtcblxuICAgIH07XG5cbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnbWVtYmVyc09ubHknLCB7XG4gICAgICAgIHVybDogJy9tZW1iZXJzLWFyZWEnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL21lbWJlcnMtb25seS9tZW1iZXJzLW9ubHkuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdNZW1iZXJDb250cm9sbGVyJyxcbiAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICAgICAgb3JkZXJzOiBmdW5jdGlvbihPcmRlcnMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gT3JkZXJzLmdldEFsbE9yZGVycygpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIC8vIFRoZSBmb2xsb3dpbmcgZGF0YS5hdXRoZW50aWNhdGUgaXMgcmVhZCBieSBhbiBldmVudCBsaXN0ZW5lclxuICAgICAgICAvLyB0aGF0IGNvbnRyb2xzIGFjY2VzcyB0byB0aGlzIHN0YXRlLiBSZWZlciB0byBhcHAuanMuXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGF1dGhlbnRpY2F0ZTogdHJ1ZVxuICAgICAgICB9XG4gICAgfSk7XG5cbn0pO1xuXG5cbmFwcC5jb250cm9sbGVyKCdNZW1iZXJDb250cm9sbGVyJywgZnVuY3Rpb24oJHNjb3BlLCAkaHR0cCwgU2VjcmV0U3Rhc2gsIG9yZGVycywgQXV0aFNlcnZpY2UpIHtcbiAgICAgXG4gICAgIFNlY3JldFN0YXNoLmdldFN0YXNoKCkudGhlbihmdW5jdGlvbiAoc3Rhc2gpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuc3Rhc2ggPSBzdGFzaDtcbiAgICAgICAgICAgIH0pO1xuICAgICBcbiAgICAgJHNjb3BlLm9yZGVyID0gb3JkZXJzXG5cblxuICAgIGNvbnNvbGUubG9nKCdjYWxsaW5nIGNvbnRyb2xsZXInLCBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uKGRhdGEpIHtyZXR1cm4gZGF0YX0pKVxuXG4gICAgIC8vICRodHRwLmdldCgnL3Nlc3Npb24nLCBmdW5jdGlvbihlcnIsIGRhdGEpIHtcbiAgICAgLy8gICAgaWYgKGVycikgcmV0dXJuIGNvbnNvbGUubG9nKGVycik7XG4gICAgIC8vICAgIGNvbnNvbGUubG9nKCd0aGlzIGlzIHRoZSBkYXRhJywgZGF0YSlcbiAgICAgLy8gfVxuICAgICAvLyBhdXRoc2VydmljZSBmb3IgbG9jYWxob3N0OjEzMzcvc2Vzc2lvblxuXG5cblxufSlcblxuYXBwLmZhY3RvcnkoJ1NlY3JldFN0YXNoJywgZnVuY3Rpb24gKCRodHRwKSB7XG5cbiAgICB2YXIgZ2V0U3Rhc2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvbWVtYmVycy9zZWNyZXQtc3Rhc2gnKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBnZXRTdGFzaDogZ2V0U3Rhc2hcbiAgICB9O1xuXG59KTsiLCIndXNlIHN0cmljdCc7XG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cdCRzdGF0ZVByb3ZpZGVyXG5cdFx0LnN0YXRlKCdvcmRlck1ndCcsIHtcblx0XHRcdHVybDogJy9vcmRlck1hbmFnZW1lbnQnLFxuXHRcdFx0dGVtcGxhdGVVcmw6ICdqcy9vcmRlci1tYW5hZ2VtZW50L29yZGVyLW1hbmFnZW1lbnQuaHRtbCcsXG5cdFx0XHRjb250cm9sbGVyOiAnT3JkZXJNYW5hZ2VtZW50Q29udHJvbGxlcicsXG5cdFx0XHRyZXNvbHZlOiB7XG5cdFx0XHRcdG9yZGVyczogZnVuY3Rpb24oT3JkZXJzKSB7XG5cdFx0XHRcdFx0cmV0dXJuIE9yZGVycy5nZXRBbGxPcmRlcnMoKVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRkZWxldGVPcmRlcjogZnVuY3Rpb24gKE9yZGVycykge1xuXHRcdFx0XHRcdHJldHVybiBPcmRlcnMuZGVsZXRlT3JkZXI7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9KVxuXHRcdC5zdGF0ZSgnb3JkZXJNZ3QuZWRpdCcsIHtcblx0XHRcdHVybDogJy86b3JkZXJJRCcsXG5cdFx0XHR0ZW1wbGF0ZVVybDogJ2pzL29yZGVyLW1hbmFuZ2VtZW50L29yZGVyLW1hbmFnZW1lbnQtZWRpdC5odG1sJyxcblx0XHRcdGNvbnRyb2xsZXI6ICdPcmRlck1hbmFnZW1lbnRDb250cm9sbGVyJ1xuXHRcdH0pXG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ09yZGVyTWFuYWdlbWVudENvbnRyb2xsZXInLCBmdW5jdGlvbigkc2NvcGUsIEF1dGhTZXJ2aWNlLCAkc3RhdGVQYXJhbXMsICRodHRwLCBvcmRlcnMsIGRlbGV0ZU9yZGVyKSB7XG5cdFx0JHNjb3BlLm9yZGVycyA9IG9yZGVycztcblxuXHRcdCRzY29wZS5kZWxldGVPcmRlciA9IGZ1bmN0aW9uKG9yZGVySUQpIHtcblx0XHRcdC8vIERlbGV0ZSB0aGUgb3JkZXIgZnJvbSB0aGUgZGF0YWJhc2Vcblx0XHRcdGRlbGV0ZU9yZGVyKG9yZGVySUQpXG5cdFx0XHRcblx0XHRcdCRzY29wZS5vcmRlcnMuZm9yRWFjaChmdW5jdGlvbiAob3JkZXIsIGlkeCkge1xuXHRcdFx0XHRpZiAob3JkZXIuX2lkID09PSBvcmRlcklEKSB7XG5cdFx0XHRcdFx0cmV0dXJuICRzY29wZS5vcmRlcnMuc3BsaWNlKGlkeCwgMSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdFx0fVxufSk7XG4iLCIndXNlIHN0cmljdCc7XG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyXG5cdCAgICAuc3RhdGUoJ3Byb2R1Y3RNZ3QnLCB7XG5cdCAgICAgICAgdXJsOiAnL3Byb2R1Y3RNYW5hZ2VtZW50LycsXG5cdCAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9wcm9kdWN0LW1hbmFnZW1lbnQvcHJvZHVjdC1tYW5hZ2VtZW50Lmh0bWwnLFxuXHQgICAgICAgIGNvbnRyb2xsZXI6ICdQcm9kdWN0TWFuYWdlbWVudENvbnRyb2xsZXInXG5cdCAgICB9KSAgXG5cdCAgICAuc3RhdGUoJ3Byb2R1Y3RNZ3QuZWRpdCcsIHtcblx0ICAgIFx0dXJsOiAnLzpwcm9kdWN0SUQnLFxuXHQgICAgXHR0ZW1wbGF0ZVVybDogJ2pzL3Byb2R1Y3QtbWFuYWdlbWVudC9wcm9kdWN0LW1hbmFnZW1lbnQtZWRpdC5odG1sJyxcblx0ICAgIFx0Y29udHJvbGxlcjogJ1Byb2R1Y3RNYW5hZ2VtZW50Q29udHJvbGxlcidcblx0ICAgIH0pXG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ1Byb2R1Y3RNYW5hZ2VtZW50Q29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsICRzdGF0ZVBhcmFtcywgJGh0dHApIHsgXG5cblxuXHQkaHR0cC5nZXQoJy9hcGkvcHJvZHVjdHMnKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICRzY29wZS5wcm9kdWN0cyA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICByZXR1cm4gJHNjb3BlLnByb2R1Y3RzO1xuICAgICAgICB9KVx0XG5cblxuXHRpZigkc3RhdGVQYXJhbXMucHJvZHVjdElEKSB7XG5cdCAgICAkaHR0cC5nZXQoJy9hcGkvcHJvZHVjdHMvJyArICRzdGF0ZVBhcmFtcy5wcm9kdWN0SUQpXG5cdFx0XHQudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcblx0XHRcdFx0JHNjb3BlLnByb2R1Y3RJdGVtID0gcmVzcG9uc2UuZGF0YTtcblx0XHRcdH0pXG5cdH1cblxuXG5cdC8vIHRoaXMgZnVuY3Rpb24gaXMgdXNlZCB3aGVuIHNhdmluZyBlZGl0cyB0byBleGlzdGluZyBwcm9kdWN0cyAtTkMgNS8yLzE1XG5cdCRzY29wZS5zYXZlUHJvZHVjdCA9IGZ1bmN0aW9uKCkge1xuXHRcdC8vIGNvbnNvbGUubG9nKCd0aGlzIGlzIHJvb3Qgc2NvcGUnLCAkcm9vdFNjb3BlLnByb2R1Y3RJdGVtKVxuXG5cdFx0Ly8gJHJvb3RTY29wZS5wcm9kdWN0cy5wdXNoKCRzY29wZS5wcm9kdWN0SXRlbSlcblx0XHRjb25zb2xlLmxvZygneW9vb29vb28nKVxuXHRcdC8vICRodHRwLnB1dCgnL2FwaS9wcm9kdWN0cycsICRzY29wZS5wcm9kdWN0SXRlbSlcblx0XHQvLyBcdC50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuXHRcdC8vIFx0XHRjb25zb2xlLmxvZyhyZXNwb25zZS5kYXRhKTtcblx0XHQvLyBcdH0pXG5cdH07XG5cblx0Ly8gcmVtb3ZlcyBhIHByb2R1Y3QgLU5DIDUvMi8xNVxuXHQkc2NvcGUucmVtb3ZlUHJvZHVjdCA9IGZ1bmN0aW9uKHByb2R1Y3QpIHtcblx0XHQkc2NvcGUucHJvZHVjdHMuZm9yRWFjaCggZnVuY3Rpb24oc2NvcGVQcm9kdWN0KSB7XG5cdFx0XHRpZiAocHJvZHVjdC5faWQgPT09IHNjb3BlUHJvZHVjdC5faWQgKSB7XG5cdFx0XHRcdHZhciBpbmRleCA9ICRzY29wZS5wcm9kdWN0cy5pbmRleE9mKHNjb3BlUHJvZHVjdCk7XG5cdFx0XHRcdHJldHVybiAkc2NvcGUucHJvZHVjdHMuc3BsaWNlKGluZGV4LCAxKTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdCRodHRwLmRlbGV0ZSgnL2FwaS9wcm9kdWN0cy8nICsgcHJvZHVjdC5faWQpXG5cdFx0XHQudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcblx0XHRcdFx0Y29uc29sZS5sb2cocmVzcG9uc2UuZGF0YSk7XG5cdFx0XHR9KVxuXHR9XG5cblxufSlcblxuIiwiJ3VzZSBzdHJpY3QnO1xuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlclxuXHQgICAgLnN0YXRlKCdwcm9kdWN0cycsIHtcblx0ICAgICAgICB1cmw6ICcvcHJvZHVjdHMnLFxuXHQgICAgICAgIHRlbXBsYXRlVXJsOiAnanMvcHJvZHVjdHMvcHJvZHVjdHMuaHRtbCcsXG5cdCAgICAgICAgY29udHJvbGxlcjogJ1Byb2R1Y3RzQ29udHJvbGxlcidcblx0ICAgIH0pXG5cdCAgICAuc3RhdGUoJ3Byb2R1Y3RzLml0ZW0nLCB7XG5cdCAgICBcdHVybDogJy86cHJvZHVjdElEJyxcblx0ICAgIFx0dGVtcGxhdGVVcmw6ICdqcy9wcm9kdWN0cy9wcm9kdWN0SXRlbS5odG1sJyxcblx0ICAgIFx0Y29udHJvbGxlcjogJ1Byb2R1Y3RzQ29udHJvbGxlcidcblx0ICAgIH0pXG5cdFx0LnN0YXRlKCdwcm9kdWN0cy5jYXRlZ29yaWVzJywge1xuXHQgICAgXHR1cmw6ICcvOnByb2R1Y3RDYXRlZ29yeScsXG5cdCAgICBcdHRlbXBsYXRlVXJsOiAnanMvcHJvZHVjdHMvcHJvZHVjdENhdGVnb3J5Lmh0bWwnLFxuXHQgICAgXHRjb250cm9sbGVyOiAnUHJvZHVjdHNDb250cm9sbGVyJ1xuXHQgICAgfSlcblx0ICAgICAgICBcbn0pO1xuXG5hcHAuY29udHJvbGxlcignUHJvZHVjdHNDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgJHN0YXRlUGFyYW1zLCAkaHR0cCkgeyBcblxuXHQvLyByZXF1ZXN0IHRvIGdldCBsaXN0IG9mIHByb2R1Y3RzIC0gTkMgNC8yNi8yMDE1XG5cdCRodHRwLmdldCgnL2FwaS9wcm9kdWN0cycpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgJHNjb3BlLnByb2R1Y3RzID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgfSlcdFxuXG4gICBcdGlmKCRzdGF0ZVBhcmFtcy5wcm9kdWN0Q2F0ZWdvcnkpIHtcblx0XHQvLyByZXF1ZXN0IHRvIGdldCBsaXN0IG9mIGNhdGVnb3JpZXMgLSBOQyA0LzI2LzIwMTVcblx0XHQkaHR0cC5nZXQoJy9hcGkvY2F0ZWdvcmllcy8nICsgJHN0YXRlUGFyYW1zLnByb2R1Y3RDYXRlZ29yeSlcblx0XHRcdC50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuXHRcdFx0XHQkc2NvcGUucHJvZHVjdENhdGVnb3J5ID0gcmVzcG9uc2UuZGF0YTtcblx0XHRcdH0pXG5cdH1cblxuXHRpZigkc3RhdGVQYXJhbXMucHJvZHVjdElEKSB7XG5cdFx0Ly8gcmVxdWVzdCB0byBnZXQgcHJvZHVjdCByZXZpZXdzIC0gTkMgNC8yNi8yMDE1XG5cdFx0JGh0dHAuZ2V0KCcvYXBpL3Byb2R1Y3RzLycgKyAkc3RhdGVQYXJhbXMucHJvZHVjdElEICsgJy9yZXZpZXdzJylcblx0XHRcdC50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuXHRcdFx0XHQkc2NvcGUucHJvZHVjdFJldmlld3MgPSByZXNwb25zZS5kYXRhXG5cdFx0XHR9KVxuXHQgICAgLy8gcmVxdWVzdCB0byBnZXQgc2luZ2xlIHByb2R1Y3QgLSBOQyA0LzI2LzIwMTVcblx0ICAgICRodHRwLmdldCgnL2FwaS9wcm9kdWN0cy8nICsgJHN0YXRlUGFyYW1zLnByb2R1Y3RJRClcblx0XHRcdC50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuXHRcdFx0XHQkc2NvcGUucHJvZHVjdEl0ZW0gPSByZXNwb25zZS5kYXRhO1xuXHRcdFx0fSlcblx0fVxuXG5cblx0Ly8gY29uc29sZS5sb2coJ3RoaXMgaXMgdGhlIGxvZ2dlZCBpbiB1c2VyJywgQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkpXG5cblx0Ly8gZnVuY3Rpb24gdG8gYWRkIGFuIG9yZGVyIHRvIGRhdGFiYXNlIC0gTkMgNC8yNi8yMDE1XG5cdCRzY29wZS5jcmVhdGVPcmRlciA9IGZ1bmN0aW9uKGlkKSB7XG5cdFx0Ly8gQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbihkYXRhKSB7Y29uc29sZS5sb2coZGF0YS5faWQpfSkgIC8vIHRoaXMgZ2l2ZXMgbWUgdGhlIGxvZ2dlZCBpbiB1c2VyXG5cdFx0JGh0dHAucG9zdCgnL2FwaS9wcm9kdWN0cy8nICsgaWQpXG5cdFx0XHQudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcblx0XHRcdFx0Y29uc29sZS5sb2coJ3N1Y2Nlc3NmdWxseSBwb3N0ZWQnLCByZXNwb25zZS5kYXRhKVxuXHRcdFx0fSlcblx0fVxuXG5cdCRzY29wZS5yZXZpZXdJdGVtID0ge1xuXHQgICAgICB1c2VyX2lkOiBudWxsLFxuXHQgICAgICBwcm9kdWN0X2lkOiAkc3RhdGVQYXJhbXMucHJvZHVjdElELFxuXHQgICAgICBzdGFyczogMCxcblx0ICAgICAgcmV2aWV3OiAnJ1xuXHQgIH07XG5cblx0ICAkc2NvcGUuc2hvd1Jldmlld0Zvcm0gPSBmYWxzZTtcblxuXHQgICRzY29wZS4kd2F0Y2goJ3Nob3dSZXZpZXdGb3JtJywgZnVuY3Rpb24oKXtcblx0ICAgICAgJHNjb3BlLmFkZFJldmlld0J1dHRvblRleHQgPSAkc2NvcGUuc2hvd1Jldmlld0Zvcm0gPyAnSGlkZSBGb3JtJyA6ICdBZGQgUmV2aWV3Jztcblx0ICB9KVxuXG5cdCAgJHNjb3BlLnN1Ym1pdFJldmlldyA9IGZ1bmN0aW9uIChyZXZpZXcpIHtcblxuXHQgICAgICAkaHR0cC5wb3N0KCcvYXBpL3Byb2R1Y3RzLycgKyAkc3RhdGVQYXJhbXMucHJvZHVjdElEICsgJy9yZXZpZXdzJywgcmV2aWV3KVxuXHQgICAgICBcdC50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuXHQgICAgICBcdFx0Y29uc29sZS5sb2cocmVzcG9uc2UuZGF0YSk7XG5cdCAgICAgIFx0fSk7XG5cblx0ICAgICAgJHNjb3BlLnJldmlld0l0ZW0gPSB7XG5cdCAgICAgICAgICB1c2VyX2lkOiBudWxsLFxuXHQgICAgICAgICAgcHJvZHVjdF9pZDogJHN0YXRlUGFyYW1zLnByb2R1Y3RJRCxcblx0ICAgICAgICAgIHN0YXJzOiAwLFxuXHQgICAgICAgICAgcmV2aWV3OiAnJ1xuXHQgICAgICB9O1xuXG5cdCAgICAgICRzY29wZS5zaG93UmV2aWV3Rm9ybSA9IGZhbHNlO1xuXHQgIH07XG5cbn0pO1xuXG5cblxuXG4iLCJhcHAuZmFjdG9yeSgnU2VhcmNoRmFjdG9yeScsIGZ1bmN0aW9uICgkaHR0cCkge1xuXG4gICAgcmV0dXJuIHtcblxuICAgICAgICBzZWFyY2hQcm9kdWN0czogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9wcm9kdWN0cy9zZWFyY2gnKS50aGVuKGZ1bmN0aW9uKHJlcyl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5kYXRhO1xuICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgIHJldHVybiBlcnI7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgfTtcblxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG4vL1RoZSBDb25maWcgYmVsb3cgZGVmaW5lcyB0aGUgL3NlYXJjaCBzdGF0ZSwgd2hpY2ggd2lsbFxuLy9hbGxvdyB0aGUgdXNlciB0byBzZWFyY2ggZm9yIHByb2R1Y3RzLlxuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcil7XG4gICAgJHN0YXRlUHJvdmlkZXJcbiAgICAgICAgLnN0YXRlKCdzZWFyY2gnLCB7XG4gICAgICAgICAgICB1cmw6ICcvc2VhcmNoJyxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnanMvc2VhcmNoL3NlYXJjaC5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdTZWFyY2hDb250cm9sbGVyJ1xuICAgICAgICB9KTtcbn0pO1xuXG5cbmFwcC5jb250cm9sbGVyKCdTZWFyY2hDb250cm9sbGVyJywgZnVuY3Rpb24oJHNjb3BlLCBTZWFyY2hGYWN0b3J5KSB7XG5cdCRzY29wZS5jcml0ZXJpYU9iamVjdCA9IHtcdFxuXHRcdHRpdGxlOiBcIlwiLFxuXHRcdGRlc2NyaXB0aW9uOiBcIlwiLFxuXHRcdHByaWNlOiAwLFxuXHRcdGNhdGVnb3JpZXM6IFtdXG5cdH07XG5cblx0JHNjb3BlLnNlYXJjaFJlc3VsdHM7XG5cbiAgICAkc2NvcGUuaW5pdGlhbGl6ZVNlYXJjaCA9IGZ1bmN0aW9uKGNyaXRlcmlhT2JqZWN0KSB7XG4gICAgXHRTZWFyY2hGYWN0b3J5LnNlYXJjaFByb2R1Y3RzKGNyaXRlcmlhT2JqZWN0KS50aGVuKGZ1bmN0aW9uKHByb2R1Y3RzKSB7XG4gICAgXHRcdCRzY29wZS5zZWFyY2hSZXN1bHRzID0gcHJvZHVjdHM7XG4gICAgXHR9KS5jYXRjaChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgIHJldHVybiBlcnI7XG4gICAgICAgIH0pO1xuICAgIH1cblxuXG4gICAgJHNjb3BlLmluaXRpYWxpemVTZWFyY2goY3JpdGVyaWFPYmplY3QpO1xufSk7IiwiYXBwLmZhY3RvcnkoJ1NpZ25VcEZhY3RvcnknLCBmdW5jdGlvbiAoJGh0dHApIHtcblxuICAgIHJldHVybiB7XG5cbiAgICAgICAgc2lnbnVwTmV3VXNlcjogZnVuY3Rpb24gKHNpZ251cE9iamVjdCkge1xuICAgICAgICAgICAgcmV0dXJuICAkaHR0cC5wb3N0KCcvYXBpL3VzZXJzJywgc2lnbnVwT2JqZWN0KVxuICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBlcnI7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICB9O1xuXG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcil7XG4gICAgJHN0YXRlUHJvdmlkZXJcbiAgICAgICAgLnN0YXRlKCdzaWdudXAnLCB7XG4gICAgICAgICAgICB1cmw6ICcvc2lnbnVwJyxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnanMvc2lnbnVwL3NpZ251cC5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdTaWduVXBDdHJsJ1xuICAgICAgICB9KTtcbn0pO1xuXG5hcHAuY29udHJvbGxlcignU2lnblVwQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsIEF1dGhTZXJ2aWNlLCAkc3RhdGUsIFNpZ25VcEZhY3RvcnkpIHtcblxuICAgICRzY29wZS5lcnJvciA9IG51bGw7XG4gICAgJHNjb3BlLnNpZ251cCA9IHt9O1xuXG4gICAgJHNjb3BlLnNlbmRTaWdudXAgPSBmdW5jdGlvbiAoc2lnbnVwKSB7XG4gICAgICAgICRzY29wZS5lcnJvciA9IG51bGw7XG5cbiAgICAgICAgU2lnblVwRmFjdG9yeS5zaWdudXBOZXdVc2VyKHNpZ251cClcblx0ICAgICAgICAudGhlbihmdW5jdGlvbih1c2VyKSB7XG5cdCAgICAgICAgXHQkc3RhdGUuZ28oJ2hvbWUnKTtcblx0ICAgICAgICBcdHJldHVybiBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKTtcblx0ICAgICAgICB9KVxuXHQgICAgICAgIC5jYXRjaChmdW5jdGlvbihlcnIpIHtcblx0ICAgICAgICBcdCRzY29wZS5lcnJvciA9ICdTaWduIHVwIGZvcm0gbm90IGNvbXBsZXRlZC9maWxsZWQgY29ycmVjdGx5ISc7XG5cdCAgICAgICAgXHRjb25zb2xlLmVycm9yKGVycik7XG5cdCAgICAgICAgfSlcbiAgICB9O1xuXG59KTsiLCIndXNlIHN0cmljdCc7XG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyXG5cdCAgICAuc3RhdGUoJ3VzZXJNZ3QnLCB7XG5cdCAgICAgICAgdXJsOiAnL3VzZXJNYW5hZ2VtZW50Jyxcblx0ICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL3VzZXItbWFuYWdlbWVudC91c2VyLW1hbmFnZW1lbnQuaHRtbCcsXG5cdCAgICAgICAgY29udHJvbGxlcjogJ1VzZXJNYW5hZ2VtZW50Q29udHJvbGxlcidcblx0ICAgIH0pICBcblx0ICAgIC5zdGF0ZSgndXNlck1ndC5lZGl0Jywge1xuXHQgICAgXHR1cmw6ICcvOnVzZXJJRCcsXG5cdCAgICBcdHRlbXBsYXRlVXJsOiAnanMvdXNlci1tYW5hZ2VtZW50L3VzZXItbWFuYWdlbWVudC1lZGl0Lmh0bWwnLFxuXHQgICAgXHRjb250cm9sbGVyOiAnVXNlck1hbmFnZW1lbnRDb250cm9sbGVyJ1xuXHQgICAgfSlcbn0pO1xuXG5hcHAuY29udHJvbGxlcignVXNlck1hbmFnZW1lbnRDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgJHN0YXRlUGFyYW1zLCAkaHR0cCkgeyBcblxuXHQkaHR0cC5nZXQoJy9hcGkvdXNlcnMnKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICRzY29wZS51c2VycyA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgIH0pXHRcblxuXHRpZiAoISEkc3RhdGVQYXJhbXMudXNlcklEKSB7XG5cdFx0ICRodHRwLmdldCgnL2FwaS91c2Vycy8nICsgJHN0YXRlUGFyYW1zLnVzZXJJRClcblx0XHRcdC50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuXHRcdFx0XHQkc2NvcGUudXNlckl0ZW0gPSByZXNwb25zZS5kYXRhO1xuXHRcdH0pXG5cdH1cblxuXHQvLyB0aGlzIGZ1bmN0aW9uIGlzIHVzZWQgd2hlbiBzYXZpbmcgZWRpdHMgdG8gZXhpc3RpbmcgdXNlcnMgLU5DIDUvMi8xNVxuXHQkc2NvcGUuc2F2ZVVzZXIgPSBmdW5jdGlvbigpIHtcblx0XHQkaHR0cC5wdXQoJy9hcGkvdXNlcnMnLCAkc2NvcGUudXNlckl0ZW0pXG5cdFx0XHQudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcblx0XHRcdFx0Y29uc29sZS5sb2cocmVzcG9uc2UuZGF0YSk7XG5cdFx0XHR9KVxuXHR9XG5cblx0Ly8gcmVtb3ZlcyBhIHVzZXIgLU5DIDUvMi8xNVxuXHQkc2NvcGUucmVtb3ZlVXNlciA9IGZ1bmN0aW9uKHVzZXIpIHtcblx0XHQkc2NvcGUudXNlcnMuZm9yRWFjaCggZnVuY3Rpb24oc2NvcGVVc2VyKSB7XG5cdFx0XHRpZiAodXNlci5faWQgPT09IHNjb3BlVXNlci5faWQgKSB7XG5cdFx0XHRcdHZhciBpbmRleCA9ICRzY29wZS51c2Vycy5pbmRleE9mKHNjb3BlVXNlcik7XG5cdFx0XHRcdHJldHVybiAkc2NvcGUudXNlcnMuc3BsaWNlKGluZGV4LCAxKTtcblx0XHRcdH1cblx0XHR9KTtcblx0XHRcblx0XHQkaHR0cC5kZWxldGUoJy9hcGkvdXNlcnMvJyArIHVzZXIuX2lkKVxuXHRcdFx0LnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKHJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0fSlcblx0fTtcblxufSlcbiIsIid1c2Ugc3RyaWN0JztcbmFwcC5mYWN0b3J5KCdSYW5kb21HcmVldGluZ3MnLCBmdW5jdGlvbiAoKSB7XG5cbiAgICB2YXIgZ2V0UmFuZG9tRnJvbUFycmF5ID0gZnVuY3Rpb24gKGFycikge1xuICAgICAgICByZXR1cm4gYXJyW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGFyci5sZW5ndGgpXTtcbiAgICB9O1xuXG4gICAgdmFyIGdyZWV0aW5ncyA9IFtcbiAgICAgICAgJ0hlbGxvLCB3b3JsZCEnLFxuICAgICAgICAnQXQgbG9uZyBsYXN0LCBJIGxpdmUhJyxcbiAgICAgICAgJ0hlbGxvLCBzaW1wbGUgaHVtYW4uJyxcbiAgICAgICAgJ1doYXQgYSBiZWF1dGlmdWwgZGF5IScsXG4gICAgICAgICdJXFwnbSBsaWtlIGFueSBvdGhlciBwcm9qZWN0LCBleGNlcHQgdGhhdCBJIGFtIHlvdXJzLiA6KScsXG4gICAgICAgICdUaGlzIGVtcHR5IHN0cmluZyBpcyBmb3IgTGluZHNheSBMZXZpbmUuJ1xuICAgIF07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBncmVldGluZ3M6IGdyZWV0aW5ncyxcbiAgICAgICAgZ2V0UmFuZG9tR3JlZXRpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBnZXRSYW5kb21Gcm9tQXJyYXkoZ3JlZXRpbmdzKTtcbiAgICAgICAgfVxuICAgIH07XG5cbn0pOyIsIid1c2Ugc3RyaWN0JztcbiIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmZhY3RvcnkoJ09yZGVycycsIGZ1bmN0aW9uIChBdXRoU2VydmljZSwgJGh0dHApIHtcblxuXHQvLyBnZXQgYWxsIG9yZGVycyBieSBhZG1pblxuICAgIHZhciBnZXRBbGxPcmRlcnMgPSBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpLnRoZW4oZnVuY3Rpb24oZGF0YSkge1xuXHRcdFx0dmFyIHVybCA9ICcvYXBpL3VzZXJzLycgKyBkYXRhLl9pZCArICcvYWxsT3JkZXJzJztcblx0ICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KHVybClcblx0XHR9KVxuXHRcdC50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuXHQgICAgXHRyZXR1cm4gcmVzcG9uc2UuZGF0YTtcblx0XHR9KVxuICAgIH1cblxuXHQvLyBkZWxldGUgdXJsOiAvYXBpL3VzZXJzL191c2VySURfL29yZGVycy9fb3JkZXJJRF8vZGVsZXRlXG5cdHZhciBkZWxldGVPcmRlciA9IGZ1bmN0aW9uKG9yZGVySUQpIHtcblx0XHRyZXR1cm4gQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKClcblx0XHRcdC50aGVuKGZ1bmN0aW9uIChkYXRhKSB7XG5cdFx0XHRcdHZhciB1cmwgPSAnL2FwaS91c2Vycy8nICsgZGF0YS5faWQgKyAnL29yZGVycy8nICsgb3JkZXJJRCArICcvZGVsZXRlJ1xuXHRcdFx0XHRyZXR1cm4gJGh0dHAuZGVsZXRlKHVybClcblx0XHRcdH0pXG5cdFx0XHQudGhlbihmdW5jdGlvbiAocmVzKSB7XG5cdFx0XHRcdHJldHVybiByZXMuZGF0YVxuXHRcdFx0fSlcblx0XHRcdC5jYXRjaCAoZnVuY3Rpb24gKGVycikge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhlcnIpXG5cdFx0XHRcdHJldHVybiBlcnJcblx0XHRcdH0pXG5cdH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBnZXRBbGxPcmRlcnM6IGdldEFsbE9yZGVycyxcblx0XHRkZWxldGVPcmRlcjogZGVsZXRlT3JkZXJcbiAgICB9XG59KVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuZmFjdG9yeSgnVXNlcnMnLCBmdW5jdGlvbiAoQXV0aFNlcnZpY2UsICRodHRwKSB7XG5cbiAgICB2YXIgZ2V0QWxsVXNlcnMgPSBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpLnRoZW4oZnVuY3Rpb24oZGF0YSkge1xuXHRcdFx0dmFyIHVybCA9ICcvYXBpL3VzZXJzLyc7XG5cdFx0XHRjb25zb2xlLmxvZyh1cmwpO1xuXHQgICAgICAgIHJldHVybiAkaHR0cC5nZXQodXJsKVxuXHRcdH0pXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG5cdCAgICBcdHJldHVybiByZXNwb25zZS5kYXRhO1xuXHRcdH0pXG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ2V0QWxsVXNlcnM6IGdldEFsbFVzZXJzXG4gICAgfTtcbn0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xuYXBwLmRpcmVjdGl2ZSgnbmF2YmFyJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIEF1dGhTZXJ2aWNlLCBBVVRIX0VWRU5UUywgJHN0YXRlKSB7XG5cbiAgICAvLyBNYWtlIHN1cmUgdG8gcnVuIGd1bHAgdGhyb3VnaG91dCBkZXYsIGFuZCBjaGFuZ2UgdGhlIHByb2R1Y3RzIHN0YXRlXG4gICAgLy8gV2hlbiBwcm9kdWN0cyBhcmUgYXZhaWxhYmxlLlxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuaHRtbCcsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xuICAgICAgICAgICAgc2NvcGUuaXRlbXMgPSBbXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ0hvbWUnLCBzdGF0ZTogJ2hvbWUnIH0sXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ1Byb2R1Y3RzJywgc3RhdGU6ICdwcm9kdWN0cycgfSxcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnQ2FydCcsIHN0YXRlOiAnY2FydCd9LFxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdQcm9kdWN0IE1hbmFnZW1lbnQnLCBzdGF0ZTogJ3Byb2R1Y3RNZ3QnLCBhZG1pbjogdHJ1ZX0sXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ09yZGVyIE1hbmFnZW1lbnQnLCBzdGF0ZTogJ29yZGVyTWd0JywgYWRtaW46IHRydWV9LFxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdVc2VyIE1hbmFnZW1lbnQnLCBzdGF0ZTogJ3VzZXJNZ3QnLCBhZG1pbjogdHJ1ZX1cbiAgICAgICAgICAgIF07XG5cbiAgICAgICAgICAgIHNjb3BlLnVzZXIgPSBudWxsO1xuICAgICAgICAgICAgc2NvcGUuY3JpdGVyaWFPYmplY3QgPSB7fVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBzY29wZS5pc0xvZ2dlZEluID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKTtcbiAgICAgICAgICAgIH07XG5cblx0XHRcdHNjb3BlLmlzQWRtaW4gPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0cmV0dXJuIEF1dGhTZXJ2aWNlLmlzQWRtaW4oKTtcblx0XHRcdH07XG5cbiAgICAgICAgICAgIHNjb3BlLmxvZ291dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBBdXRoU2VydmljZS5sb2dvdXQoKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2hvbWUnKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHNjb3BlLnNlYXJjaCA9IGZ1bmN0aW9uICh0aXRsZSkge1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnc2VhcmNoJyk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB2YXIgc2V0VXNlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLnVzZXIgPSB1c2VyO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIHJlbW92ZVVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgc2NvcGUudXNlciA9IG51bGw7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHNldFVzZXIoKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubG9naW5TdWNjZXNzLCBzZXRVc2VyKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLmxvZ291dFN1Y2Nlc3MsIHJlbW92ZVVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsIHJlbW92ZVVzZXIpO1xuXG4gICAgICAgIH1cblxuICAgIH07XG5cbn0pO1xuIiwiLy8gdW5hYmxlIHRvIGdldCB0aGlzIHdvcmsgYXQgdGhlIG1vbWVudCAtIE5DIDQvMjYvMjAxNVxuXG4ndXNlIHN0cmljdCc7XG5hcHAuZGlyZWN0aXZlKCdoaXBzaGFkZXNMb2dvJywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvaGlwc2hhZGVzLWxvZ28vaGlwc2hhZGVzLWxvZ28uaHRtbCdcbiAgICB9O1xufSk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9