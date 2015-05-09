'use strict';
var app = angular.module('FullstackGeneratedApp', ['ui.router', 'fsaPreBuilt', 'ui.bootstrap']);

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
            order: function order(CartFactory) {
                return CartFactory.getCurrentUser();
            },
            user: function user(AuthService) {
                return AuthService.getLoggedInUser();
            }
        },
        // The following data.authenticate is read by an event listener that controls access to this state. Refer to app.js.
        data: {
            authenticate: true
        }
    }).state('membersOnly.edit', {
        url: '/:userID',
        templateUrl: 'js/members-only/members-only-edit.html'
    }).state('membersOnly.review', {
        url: '/:productID',
        templateUrl: 'js/members-only/members-only-review.html',
        controller: 'MemberController'
    });
});

app.controller('MemberController', function ($scope, $http, order, user, $stateParams) {

    $scope.order = order;
    $scope.user = user;

    $scope.saveUser = function () {
        $http.put('/api/users', $scope.user).then(function (response) {
            console.log(response.data);
        });
    };

    if ($stateParams.productID) {
        $scope.submitReview = function (review) {
            review.product_id = $stateParams.productID;
            review.user_id = $scope.user._id;

            $http.post('/api/products/' + $stateParams.productID + '/reviews', review).then(function (response) {
                console.log('successfully saved review', response.data);
            });
        };
    };
});

app.filter('orderStatus', function () {
    return function (input) {
        if (input === false) {
            return 'In Progress';
        } else {
            return 'Completed';
        }
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
        url: '/:orderId',
        templateUrl: 'js/order-management/order-management-edit.html',
        controller: 'OrderManagementController'
    });
});

app.controller('OrderManagementController', function ($scope, AuthService, $stateParams, orders, deleteOrder, Orders) {
    $scope.orders = orders;

    if ($stateParams.orderId) {
        Orders.getOrder($stateParams.orderId).then(function (order) {
            $scope.orderItem = order;
        });
    };

    $scope.deleteOrder = function (orderID) {

        // Delete the order from the database
        deleteOrder(orderID);

        $scope.orders.forEach(function (order, idx) {
            if (order._id === orderID) {
                return $scope.orders.splice(idx, 1);
            }
        });
    };

    $scope.saveOrder = function () {
        Orders.saveOrder($scope.orderItem);
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

app.controller('ProductManagementController', function ($scope, $stateParams, $http, ProductFactory) {

    ProductFactory.products().then(function (product) {
        $scope.products = product;
    });

    if ($stateParams.productID) {
        ProductFactory.productItem($stateParams.productID).then(function (item) {
            $scope.productItem = item;
        });
    }

    $scope.saveProduct = function () {
        ProductFactory.saveProduct($scope.productItem);
    };

    $scope.removeProduct = function (product) {
        $scope.products.forEach(function (scopeProduct) {
            if (product._id === scopeProduct._id) {
                var index = $scope.products.indexOf(scopeProduct);
                return $scope.products.splice(index, 1);
            }
        });
        ProductFactory.removeProduct(product._id);
    };
});

app.factory('ProductFactory', function ($http) {

    return {

        products: function products() {
            return $http.get('/api/products').then(function (response) {
                return response.data;
            });
        },

        productCategory: function productCategory(category) {
            return $http.get('/api/categories/' + category).then(function (response) {
                return response.data;
            });
        },

        productReviews: function productReviews(id) {
            return $http.get('/api/products/' + id + '/reviews').then(function (response) {
                return response.data;
            });
        },

        productItem: function productItem(id) {
            return $http.get('/api/products/' + id).then(function (response) {
                return response.data;
            });
        },

        createOrder: function createOrder(id) {
            return $http.post('/api/products/' + id);
        },

        saveProduct: function saveProduct(item) {
            return $http.put('/api/products', item);
        },

        removeProduct: function removeProduct(id) {
            return $http['delete']('/api/products/' + id);
        },

        getBrands: function getBrands() {
            return $http.get('/api/categories/').then(function (response) {
                return response.data;
            });
        },

        submitReview: function submitReview(productID, review) {
            return $http.post('/api/products/' + productID + '/reviews', review).then(function (response) {
                return response.data;
            });
        }

    };
});
'use strict';
app.config(function ($stateProvider) {
    $stateProvider.state('products', {
        url: '/',
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

app.controller('ProductsController', function ($scope, $stateParams, ProductFactory) {

    $scope.currentCategory;
    $scope.genders = ['Women', 'Men'];
    $scope.slides = [];

    ProductFactory.getBrands().then(function (brands) {
        $scope.brands = brands;
    });

    if ($stateParams.productCategory) {
        ProductFactory.productCategory($stateParams.productCategory).then(function (category) {
            $scope.productCategory = category;
            $scope.currentCategory = $stateParams.productCategory;
        });
    }

    if ($stateParams.productID) {
        ProductFactory.productReviews($stateParams.productID).then(function (reviews) {
            $scope.productReviews = reviews;
        });

        ProductFactory.productItem($stateParams.productID).then(function (item) {
            $scope.productItem = item;

            $scope.slides = [];

            for (var i = 0; i < $scope.productItem.imageURL.length; i++) {
                $scope.slides.push({
                    image: $scope.productItem.imageURL[i]
                });
            }
        });
    };

    $scope.createOrder = function (id) {
        ProductFactory.createOrder(id);
    };

    $scope.outOfStock = function (stock) {
        if (stock > 0) {
            return true;
        } else {
            return false;
        }
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

        ProductFactory.submitReview($stateParams.productID, review).then(function (review) {
            console.log('Review submitted - ', review);
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

        searchProducts: function searchProducts(params) {
            return $http({
                url: '/api/search',
                method: 'GET',
                params: params
            }).then(function (res) {
                return res.data;
            })['catch'](function (err) {
                console.error(err);
                return err;
            });
        },

        getBrands: function getBrands() {
            return $http.get('api/categories').then(function (res) {
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
        url: '/search?:param',
        templateUrl: 'js/search/search.html',
        controller: 'SearchController'
    });
});

app.controller('SearchController', function ($scope, $stateParams, SearchFactory) {
    $scope.brands = [];
    $scope.paramObj = {};
    $scope.searchResults = [];

    $scope.minPriceRanges = [{ text: '$0', value: '' }, { text: '$50', value: 50 }, { text: '$100', value: 100 }, { text: '$150', value: 150 }];

    $scope.maxPriceRanges = [{ text: '$50', value: 50 }, { text: '$100', value: 100 }, { text: '$150', value: 150 }, { text: '$200 and over', value: '' }];

    function setParamObj() {
        $scope.paramObj = {
            title: '',
            brands: [],
            gender: '',
            priceRange: { min: '', max: '' },
            avgStars: ''
        };
    };

    $scope.getPanelData = function () {
        SearchFactory.getBrands().then(function (brands) {
            $scope.brands = brands;
        })['catch'](function (err) {
            console.error(err);
            return err;
        });
    };

    $scope.initializeSearch = function () {
        SearchFactory.searchProducts($scope.paramObj).then(function (products) {
            $scope.searchResults = products;
            console.log(products);
        })['catch'](function (err) {
            console.error(err);
            return err;
        });
    };

    $scope.toggleSelection = function (brand) {
        var idx = $scope.paramObj.brands.indexOf(brand);

        if (idx > -1) {
            $scope.paramObj.brands.splice(idx, 1);
        } else {
            $scope.paramObj.brands.push(brand);
        }
    };

    $scope.resetParams = function () {
        setParamObj();
        $scope.searchResults = {};
    };

    setParamObj();
    $scope.getPanelData();

    if ($stateParams.param) {
        $scope.paramObj.title = $stateParams.param;
        $scope.initializeSearch();
    }
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

    // delete url: /api/users/_userID_/orders/_orderId_/delete
    var deleteOrder = function deleteOrder(orderId) {
        return AuthService.getLoggedInUser().then(function (data) {
            var url = '/api/users/' + data._id + '/orders/' + orderId + '/delete';
            return $http['delete'](url);
        }).then(function (res) {
            return res.data;
        })['catch'](function (err) {
            console.log(err);
            return err;
        });
    };

    var getOrder = function getOrder(orderId) {
        return AuthService.getLoggedInUser().then(function (data) {
            var url = '/api/users/' + data._id + '/orders/' + orderId;
            return $http.get(url);
        }).then(function (res) {
            return res.data;
        })['catch'](function (err) {
            console.log(err);
            return err;
        });
    };

    var saveOrder = function saveOrder(order) {
        return AuthService.getLoggedInUser().then(function (data) {
            var url = '/api/users/' + data._id + '/orders/' + order._id;
            console.log(order);
            return $http.put(url, order);
        });
    };

    return {
        getAllOrders: getAllOrders,
        deleteOrder: deleteOrder,
        getOrder: getOrder,
        saveOrder: saveOrder
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
            scope.items = [{ label: 'Home', state: 'products' }, { label: 'Cart', state: 'cart' }, { label: 'User Settings', state: 'membersOnly', auth: true }];
            scope.adminItems = [{ label: 'Product Management', state: 'productMgt', admin: true }, { label: 'Order Management', state: 'orderMgt', admin: true }, { label: 'User Management', state: 'userMgt', admin: true }];

            scope.user = null;
            scope.navSearchString = null;

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

            scope.search = function () {
                $state.go('search', { param: scope.navSearchString });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNhcnQvQ2FydEZhY3RvcnkuanMiLCJjYXJ0L2NhcnQuanMiLCJmc2EvZnNhLXByZS1idWlsdC5qcyIsImhvbWUvaG9tZS5qcyIsImxvZ2luL2xvZ2luLmpzIiwibWVtYmVycy1vbmx5L21lbWJlcnMtb25seS5qcyIsIm9yZGVyLW1hbmFnZW1lbnQvb3JkZXItbWFuYWdlbWVudC5qcyIsInByb2R1Y3QtbWFuYWdlbWVudC9wcm9kdWN0LW1hbmFnZW1lbnQuanMiLCJwcm9kdWN0cy9Qcm9kdWN0RmFjdG9yeS5qcyIsInByb2R1Y3RzL3Byb2R1Y3RzLmpzIiwic2VhcmNoL1NlYXJjaEZhY3RvcnkuanMiLCJzZWFyY2gvc2VhcmNoLmpzIiwic2lnbnVwL1NpZ251cEZhY3RvcnkuanMiLCJzaWdudXAvc2lnbnVwLmpzIiwidXNlci1tYW5hZ2VtZW50L3VzZXItbWFuYWdlbWVudC5qcyIsImNvbW1vbi9mYWN0b3JpZXMvUmFuZG9tR3JlZXRpbmdzLmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9Tb2NrZXQuanMiLCJjb21tb24vZmFjdG9yaWVzL2dldE9yZGVycy5qcyIsImNvbW1vbi9mYWN0b3JpZXMvZ2V0VXNlckRhdGEuanMiLCJjb21tb24vZGlyZWN0aXZlcy9oaXBzaGFkZXMtbG9nby9oaXBzaGFkZXMtbG9nby5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBQSxDQUFBO0FBQ0EsSUFBQSxHQUFBLEdBQUEsT0FBQSxDQUFBLE1BQUEsQ0FBQSx1QkFBQSxFQUFBLENBQUEsV0FBQSxFQUFBLGFBQUEsRUFBQSxjQUFBLENBQUEsQ0FBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxrQkFBQSxFQUFBLGlCQUFBLEVBQUE7O0FBRUEscUJBQUEsQ0FBQSxTQUFBLENBQUEsSUFBQSxDQUFBLENBQUE7O0FBRUEsc0JBQUEsQ0FBQSxTQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7Q0FDQSxDQUFBLENBQUE7OztBQUlBLEdBQUEsQ0FBQSxHQUFBLENBQUEsVUFBQSxVQUFBLEVBQUEsV0FBQSxFQUFBLE1BQUEsRUFBQTs7O0FBR0EsUUFBQSw0QkFBQSxHQUFBLHNDQUFBLEtBQUEsRUFBQTtBQUNBLGVBQUEsS0FBQSxDQUFBLElBQUEsSUFBQSxLQUFBLENBQUEsSUFBQSxDQUFBLFlBQUEsQ0FBQTtLQUNBLENBQUE7Ozs7QUFJQSxjQUFBLENBQUEsR0FBQSxDQUFBLG1CQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUEsT0FBQSxFQUFBLFFBQUEsRUFBQTs7QUFFQSxZQUFBLENBQUEsNEJBQUEsQ0FBQSxPQUFBLENBQUEsRUFBQTs7O0FBR0EsbUJBQUE7U0FDQTs7QUFFQSxZQUFBLFdBQUEsQ0FBQSxlQUFBLEVBQUEsRUFBQTs7O0FBR0EsbUJBQUE7U0FDQTs7O0FBR0EsYUFBQSxDQUFBLGNBQUEsRUFBQSxDQUFBOztBQUVBLG1CQUFBLENBQUEsZUFBQSxFQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsSUFBQSxFQUFBOzs7O0FBSUEsZ0JBQUEsSUFBQSxFQUFBO0FBQ0Esc0JBQUEsQ0FBQSxFQUFBLENBQUEsT0FBQSxDQUFBLElBQUEsRUFBQSxRQUFBLENBQUEsQ0FBQTthQUNBLE1BQUE7QUFDQSxzQkFBQSxDQUFBLEVBQUEsQ0FBQSxPQUFBLENBQUEsQ0FBQTthQUNBO1NBQ0EsQ0FBQSxDQUFBO0tBRUEsQ0FBQSxDQUFBO0NBRUEsQ0FBQSxDQUFBO0FDbkRBLEdBQUEsQ0FBQSxPQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBOztBQUVBLFdBQUE7O0FBRUEsc0JBQUEsRUFBQSwwQkFBQTs7O0FBR0EsbUJBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSx5QkFBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0Esb0JBQUEsR0FBQSxDQUFBLElBQUEsRUFDQSxPQUFBLEdBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQSxDQUFBLENBQUE7YUFDQSxDQUFBLFNBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLHVCQUFBLENBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBO0FBQ0EsdUJBQUEsR0FBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7O0FBRUEsMkJBQUEsRUFBQSw2QkFBQSxNQUFBLEVBQUEsT0FBQSxFQUFBLFNBQUEsRUFBQTtBQUNBLG1CQUFBLEtBQUEsVUFBQSxDQUFBLGFBQUEsR0FBQSxNQUFBLEdBQUEsVUFBQSxHQUFBLE9BQUEsR0FBQSxZQUFBLEdBQUEsU0FBQSxDQUFBLENBQ0EsSUFBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsdUJBQUEsR0FBQSxDQUFBLElBQUEsQ0FBQTthQUNBLENBQUEsU0FBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsdUJBQUEsQ0FBQSxLQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7QUFDQSx1QkFBQSxHQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FFQTs7QUFFQSxnQkFBQSxFQUFBLGtCQUFBLFlBQUEsRUFBQTtBQUNBLGdCQUFBLEtBQUEsR0FBQSxDQUFBLENBQUE7O0FBRUEsd0JBQUEsQ0FBQSxRQUFBLENBQUEsT0FBQSxDQUFBLFVBQUEsSUFBQSxFQUFBO0FBQ0EscUJBQUEsSUFBQSxJQUFBLENBQUEsRUFBQSxDQUFBLEtBQUEsR0FBQSxJQUFBLENBQUEsUUFBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBOztBQUVBLG1CQUFBLEtBQUEsQ0FBQTtTQUNBOztBQUVBLGlCQUFBLEVBQUEsbUJBQUEsWUFBQSxFQUFBO0FBQ0EsZ0JBQUEsS0FBQSxHQUFBLENBQUEsQ0FBQTs7QUFFQSx3QkFBQSxDQUFBLFFBQUEsQ0FBQSxPQUFBLENBQUEsVUFBQSxJQUFBLEVBQUE7QUFDQSxxQkFBQSxJQUFBLElBQUEsQ0FBQSxRQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7O0FBRUEsbUJBQUEsS0FBQSxDQUFBO1NBQ0E7O0FBRUEsaUJBQUEsRUFBQSxtQkFBQSxNQUFBLEVBQUEsT0FBQSxFQUFBLFlBQUEsRUFBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxJQUFBLENBQUEsYUFBQSxHQUFBLE1BQUEsR0FBQSxVQUFBLEdBQUEsT0FBQSxFQUFBLFlBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLHVCQUFBLEdBQUEsQ0FBQSxJQUFBLENBQUE7YUFDQSxDQUFBLFNBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLHVCQUFBLENBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBO0FBQ0EsdUJBQUEsR0FBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7O0tBRUEsQ0FBQTtDQUVBLENBQUEsQ0FBQTtBQzFEQSxZQUFBLENBQUE7Ozs7O0FBS0EsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTtBQUNBLGtCQUFBLENBQ0EsS0FBQSxDQUFBLE1BQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxPQUFBO0FBQ0EsbUJBQUEsRUFBQSxtQkFBQTtBQUNBLGtCQUFBLEVBQUEsZ0JBQUE7S0FDQSxDQUFBLENBQUE7Q0FDQSxDQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFVBQUEsQ0FBQSxnQkFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLFdBQUEsRUFBQTs7O0FBR0EsVUFBQSxDQUFBLFVBQUEsR0FBQSxDQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQSxDQUFBLENBQUE7O0FBRUEsVUFBQSxDQUFBLGNBQUEsR0FBQSxZQUFBO0FBQ0EsbUJBQUEsQ0FBQSxjQUFBLEVBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxZQUFBLEVBQUE7O0FBRUEsZ0JBQUEsWUFBQSxLQUFBLFdBQUEsRUFBQTtBQUNBLHVCQUFBLENBQUEsR0FBQSxDQUFBLGlCQUFBLENBQUEsQ0FBQTthQUNBLE1BQUE7QUFDQSxzQkFBQSxDQUFBLGVBQUEsQ0FBQSxZQUFBLENBQUEsQ0FBQTthQUNBO1NBQ0EsQ0FBQSxTQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSxtQkFBQSxDQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQTtBQUNBLG1CQUFBLEdBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLGFBQUEsR0FBQSxVQUFBLE9BQUEsRUFBQTs7QUFFQSxtQkFBQSxDQUFBLG1CQUFBLENBQUEsTUFBQSxDQUFBLFlBQUEsQ0FBQSxPQUFBLEVBQUEsTUFBQSxDQUFBLFlBQUEsQ0FBQSxHQUFBLEVBQUEsT0FBQSxDQUFBLEVBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxlQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLGVBQUEsQ0FBQSxlQUFBLENBQUEsQ0FBQTtTQUNBLENBQUEsU0FBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsbUJBQUEsQ0FBQSxLQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7QUFDQSxtQkFBQSxHQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxZQUFBLEdBQUEsWUFBQTtBQUNBLG1CQUFBLENBQUEsU0FBQSxDQUFBLE1BQUEsQ0FBQSxZQUFBLENBQUEsT0FBQSxFQUFBLE1BQUEsQ0FBQSxZQUFBLENBQUEsR0FBQSxFQUFBLE1BQUEsQ0FBQSxZQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxlQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLGVBQUEsQ0FBQSxlQUFBLENBQUEsQ0FBQTtTQUNBLENBQUEsU0FBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsbUJBQUEsQ0FBQSxLQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7QUFDQSxtQkFBQSxHQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxlQUFBLEdBQUEsVUFBQSxZQUFBLEVBQUE7QUFDQSxZQUFBLFlBQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsU0FBQSxHQUFBLFlBQUEsQ0FBQSxRQUFBLENBQUE7QUFDQSxrQkFBQSxDQUFBLFlBQUEsR0FBQSxZQUFBLENBQUE7QUFDQSxrQkFBQSxDQUFBLFFBQUEsR0FBQSxXQUFBLENBQUEsUUFBQSxDQUFBLFlBQUEsQ0FBQSxDQUFBO0FBQ0Esa0JBQUEsQ0FBQSxTQUFBLEdBQUEsV0FBQSxDQUFBLFNBQUEsQ0FBQSxZQUFBLENBQUEsQ0FBQTtBQUNBLGtCQUFBLENBQUEsUUFBQSxHQUFBLE1BQUEsQ0FBQSxRQUFBLEdBQUEsQ0FBQSxHQUFBLElBQUEsR0FBQSxDQUFBLENBQUE7QUFDQSxrQkFBQSxDQUFBLGdCQUFBLEdBQUEsTUFBQSxDQUFBLFFBQUEsR0FBQSxDQUFBLEdBQUEsRUFBQSxHQUFBLENBQUEsQ0FBQTtBQUNBLGtCQUFBLENBQUEsVUFBQSxHQUFBLE1BQUEsQ0FBQSxRQUFBLEdBQUEsTUFBQSxDQUFBLFFBQUEsR0FBQSxNQUFBLENBQUEsZ0JBQUEsQ0FBQTtTQUNBO0tBQ0EsQ0FBQTs7QUFFQSxVQUFBLENBQUEsY0FBQSxFQUFBLENBQUE7Q0FDQSxDQUFBLENBQUE7QUNqRUEsQ0FBQSxZQUFBOztBQUVBLGdCQUFBLENBQUE7OztBQUdBLFFBQUEsQ0FBQSxNQUFBLENBQUEsT0FBQSxFQUFBLE1BQUEsSUFBQSxLQUFBLENBQUEsd0JBQUEsQ0FBQSxDQUFBOztBQUVBLFFBQUEsR0FBQSxHQUFBLE9BQUEsQ0FBQSxNQUFBLENBQUEsYUFBQSxFQUFBLEVBQUEsQ0FBQSxDQUFBOztBQUVBLE9BQUEsQ0FBQSxPQUFBLENBQUEsUUFBQSxFQUFBLFVBQUEsU0FBQSxFQUFBOztBQUVBLFlBQUEsQ0FBQSxNQUFBLENBQUEsRUFBQSxFQUFBLE1BQUEsSUFBQSxLQUFBLENBQUEsc0JBQUEsQ0FBQSxDQUFBOztBQUVBLFlBQUEsTUFBQSxDQUFBOztBQUVBLFlBQUEsU0FBQSxDQUFBLE1BQUEsRUFBQTtBQUNBLGtCQUFBLEdBQUEsRUFBQSxDQUFBLHVCQUFBLENBQUEsQ0FBQTtTQUNBLE1BQUE7QUFDQSxrQkFBQSxHQUFBLEVBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQTtTQUNBOztBQUVBLGVBQUEsTUFBQSxDQUFBO0tBRUEsQ0FBQSxDQUFBOzs7OztBQUtBLE9BQUEsQ0FBQSxRQUFBLENBQUEsYUFBQSxFQUFBO0FBQ0Esb0JBQUEsRUFBQSxvQkFBQTtBQUNBLG1CQUFBLEVBQUEsbUJBQUE7QUFDQSxxQkFBQSxFQUFBLHFCQUFBO0FBQ0Esc0JBQUEsRUFBQSxzQkFBQTtBQUNBLHdCQUFBLEVBQUEsd0JBQUE7QUFDQSxxQkFBQSxFQUFBLHFCQUFBO0tBQ0EsQ0FBQSxDQUFBOztBQUVBLE9BQUEsQ0FBQSxPQUFBLENBQUEsaUJBQUEsRUFBQSxVQUFBLFVBQUEsRUFBQSxFQUFBLEVBQUEsV0FBQSxFQUFBO0FBQ0EsWUFBQSxVQUFBLEdBQUE7QUFDQSxlQUFBLEVBQUEsV0FBQSxDQUFBLGdCQUFBO0FBQ0EsZUFBQSxFQUFBLFdBQUEsQ0FBQSxhQUFBO0FBQ0EsZUFBQSxFQUFBLFdBQUEsQ0FBQSxjQUFBO0FBQ0EsZUFBQSxFQUFBLFdBQUEsQ0FBQSxjQUFBO1NBQ0EsQ0FBQTtBQUNBLGVBQUE7QUFDQSx5QkFBQSxFQUFBLHVCQUFBLFFBQUEsRUFBQTtBQUNBLDBCQUFBLENBQUEsVUFBQSxDQUFBLFVBQUEsQ0FBQSxRQUFBLENBQUEsTUFBQSxDQUFBLEVBQUEsUUFBQSxDQUFBLENBQUE7QUFDQSx1QkFBQSxFQUFBLENBQUEsTUFBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBO2FBQ0E7U0FDQSxDQUFBO0tBQ0EsQ0FBQSxDQUFBOztBQUVBLE9BQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxhQUFBLEVBQUE7QUFDQSxxQkFBQSxDQUFBLFlBQUEsQ0FBQSxJQUFBLENBQUEsQ0FDQSxXQUFBLEVBQ0EsVUFBQSxTQUFBLEVBQUE7QUFDQSxtQkFBQSxTQUFBLENBQUEsR0FBQSxDQUFBLGlCQUFBLENBQUEsQ0FBQTtTQUNBLENBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQSxDQUFBOztBQUVBLE9BQUEsQ0FBQSxPQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBLE9BQUEsRUFBQSxVQUFBLEVBQUEsV0FBQSxFQUFBLEVBQUEsRUFBQTs7OztBQUlBLFlBQUEsQ0FBQSxlQUFBLEdBQUEsWUFBQTtBQUNBLG1CQUFBLENBQUEsQ0FBQSxPQUFBLENBQUEsSUFBQSxDQUFBO1NBQ0EsQ0FBQTs7QUFFQSxZQUFBLENBQUEsZUFBQSxHQUFBLFlBQUE7Ozs7O0FBS0EsZ0JBQUEsSUFBQSxDQUFBLGVBQUEsRUFBQSxFQUFBO0FBQ0EsdUJBQUEsRUFBQSxDQUFBLElBQUEsQ0FBQSxPQUFBLENBQUEsSUFBQSxDQUFBLENBQUE7YUFDQTs7Ozs7QUFLQSxtQkFBQSxLQUFBLENBQUEsR0FBQSxDQUFBLFVBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxpQkFBQSxDQUFBLFNBQUEsQ0FBQSxZQUFBO0FBQ0EsdUJBQUEsSUFBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBRUEsQ0FBQTs7QUFFQSxZQUFBLENBQUEsT0FBQSxHQUFBLFlBQUE7QUFDQSxnQkFBQSxJQUFBLENBQUEsZUFBQSxFQUFBLEVBQ0EsT0FBQSxDQUFBLENBQUEsT0FBQSxDQUFBLElBQUEsQ0FBQSxLQUFBLENBQUEsS0FFQSxPQUFBLEtBQUEsQ0FBQTtTQUNBLENBQUE7O0FBRUEsWUFBQSxDQUFBLEtBQUEsR0FBQSxVQUFBLFdBQUEsRUFBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxJQUFBLENBQUEsUUFBQSxFQUFBLFdBQUEsQ0FBQSxDQUNBLElBQUEsQ0FBQSxpQkFBQSxDQUFBLFNBQ0EsQ0FBQSxVQUFBLFFBQUEsRUFBQTtBQUNBLHVCQUFBLEVBQUEsQ0FBQSxNQUFBLENBQUEsRUFBQSxPQUFBLEVBQUEsNEJBQUEsRUFBQSxDQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FDQSxDQUFBOztBQUVBLFlBQUEsQ0FBQSxNQUFBLEdBQUEsWUFBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsU0FBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFlBQUE7QUFDQSx1QkFBQSxDQUFBLE9BQUEsRUFBQSxDQUFBO0FBQ0EsMEJBQUEsQ0FBQSxVQUFBLENBQUEsV0FBQSxDQUFBLGFBQUEsQ0FBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0EsQ0FBQTs7QUFFQSxpQkFBQSxpQkFBQSxDQUFBLFFBQUEsRUFBQTtBQUNBLGdCQUFBLElBQUEsR0FBQSxRQUFBLENBQUEsSUFBQSxDQUFBO0FBQ0EsbUJBQUEsQ0FBQSxNQUFBLENBQUEsSUFBQSxDQUFBLEVBQUEsRUFBQSxJQUFBLENBQUEsSUFBQSxDQUFBLENBQUE7QUFDQSxzQkFBQSxDQUFBLFVBQUEsQ0FBQSxXQUFBLENBQUEsWUFBQSxDQUFBLENBQUE7QUFDQSxtQkFBQSxJQUFBLENBQUEsSUFBQSxDQUFBO1NBQ0EsQ0FBQTtLQUVBLENBQUEsQ0FBQTs7QUFFQSxPQUFBLENBQUEsT0FBQSxDQUFBLFNBQUEsRUFBQSxVQUFBLFVBQUEsRUFBQSxXQUFBLEVBQUE7O0FBRUEsWUFBQSxJQUFBLEdBQUEsSUFBQSxDQUFBOztBQUVBLGtCQUFBLENBQUEsR0FBQSxDQUFBLFdBQUEsQ0FBQSxnQkFBQSxFQUFBLFlBQUE7QUFDQSxnQkFBQSxDQUFBLE9BQUEsRUFBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBOztBQUVBLGtCQUFBLENBQUEsR0FBQSxDQUFBLFdBQUEsQ0FBQSxjQUFBLEVBQUEsWUFBQTtBQUNBLGdCQUFBLENBQUEsT0FBQSxFQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7O0FBRUEsWUFBQSxDQUFBLEVBQUEsR0FBQSxJQUFBLENBQUE7QUFDQSxZQUFBLENBQUEsSUFBQSxHQUFBLElBQUEsQ0FBQTs7QUFFQSxZQUFBLENBQUEsTUFBQSxHQUFBLFVBQUEsU0FBQSxFQUFBLElBQUEsRUFBQTtBQUNBLGdCQUFBLENBQUEsRUFBQSxHQUFBLFNBQUEsQ0FBQTtBQUNBLGdCQUFBLENBQUEsSUFBQSxHQUFBLElBQUEsQ0FBQTtTQUNBLENBQUE7O0FBRUEsWUFBQSxDQUFBLE9BQUEsR0FBQSxZQUFBO0FBQ0EsZ0JBQUEsQ0FBQSxFQUFBLEdBQUEsSUFBQSxDQUFBO0FBQ0EsZ0JBQUEsQ0FBQSxJQUFBLEdBQUEsSUFBQSxDQUFBO1NBQ0EsQ0FBQTtLQUVBLENBQUEsQ0FBQTtDQUVBLENBQUEsRUFBQSxDQUFBOztBQ2pKQSxZQUFBLENBQUE7QUFDQSxHQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FDQSxLQUFBLENBQUEsTUFBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLEdBQUE7QUFDQSxtQkFBQSxFQUFBLG1CQUFBLEVBQ0EsQ0FBQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBOztBQ1BBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7O0FBRUEsa0JBQUEsQ0FBQSxLQUFBLENBQUEsT0FBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLFFBQUE7QUFDQSxtQkFBQSxFQUFBLHFCQUFBO0FBQ0Esa0JBQUEsRUFBQSxXQUFBO0tBQ0EsQ0FBQSxDQUFBO0NBRUEsQ0FBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxVQUFBLENBQUEsV0FBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLFdBQUEsRUFBQSxNQUFBLEVBQUE7O0FBRUEsVUFBQSxDQUFBLEtBQUEsR0FBQSxFQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsS0FBQSxHQUFBLElBQUEsQ0FBQTs7QUFFQSxVQUFBLENBQUEsU0FBQSxHQUFBLFVBQUEsU0FBQSxFQUFBOztBQUVBLGNBQUEsQ0FBQSxLQUFBLEdBQUEsSUFBQSxDQUFBOztBQUVBLG1CQUFBLENBQUEsS0FBQSxDQUFBLFNBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxZQUFBO0FBQ0Esa0JBQUEsQ0FBQSxFQUFBLENBQUEsTUFBQSxDQUFBLENBQUE7U0FDQSxDQUFBLFNBQUEsQ0FBQSxZQUFBO0FBQ0Esa0JBQUEsQ0FBQSxLQUFBLEdBQUEsNEJBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUVBLENBQUE7Q0FFQSxDQUFBLENBQUE7QUMzQkEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTs7QUFFQSxrQkFBQSxDQUNBLEtBQUEsQ0FBQSxhQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsZUFBQTtBQUNBLG1CQUFBLEVBQUEsbUNBQUE7QUFDQSxrQkFBQSxFQUFBLGtCQUFBO0FBQ0EsZUFBQSxFQUFBO0FBQ0EsaUJBQUEsRUFBQSxlQUFBLFdBQUEsRUFBQTtBQUNBLHVCQUFBLFdBQUEsQ0FBQSxjQUFBLEVBQUEsQ0FBQTthQUNBO0FBQ0EsZ0JBQUEsRUFBQSxjQUFBLFdBQUEsRUFBQTtBQUNBLHVCQUFBLFdBQUEsQ0FBQSxlQUFBLEVBQUEsQ0FBQTthQUNBO1NBQ0E7O0FBRUEsWUFBQSxFQUFBO0FBQ0Esd0JBQUEsRUFBQSxJQUFBO1NBQ0E7S0FDQSxDQUFBLENBQ0EsS0FBQSxDQUFBLGtCQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsVUFBQTtBQUNBLG1CQUFBLEVBQUEsd0NBQUE7S0FDQSxDQUFBLENBQ0EsS0FBQSxDQUFBLG9CQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsYUFBQTtBQUNBLG1CQUFBLEVBQUEsMENBQUE7QUFDQSxrQkFBQSxFQUFBLGtCQUFBO0tBQ0EsQ0FBQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxVQUFBLENBQUEsa0JBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxLQUFBLEVBQUEsS0FBQSxFQUFBLElBQUEsRUFBQSxZQUFBLEVBQUE7O0FBRUEsVUFBQSxDQUFBLEtBQUEsR0FBQSxLQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsSUFBQSxHQUFBLElBQUEsQ0FBQTs7QUFFQSxVQUFBLENBQUEsUUFBQSxHQUFBLFlBQUE7QUFDQSxhQUFBLENBQUEsR0FBQSxDQUFBLFlBQUEsRUFBQSxNQUFBLENBQUEsSUFBQSxDQUFBLENBQ0EsSUFBQSxDQUFBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsbUJBQUEsQ0FBQSxHQUFBLENBQUEsUUFBQSxDQUFBLElBQUEsQ0FBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxRQUFBLFlBQUEsQ0FBQSxTQUFBLEVBQUE7QUFDQSxjQUFBLENBQUEsWUFBQSxHQUFBLFVBQUEsTUFBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxVQUFBLEdBQUEsWUFBQSxDQUFBLFNBQUEsQ0FBQTtBQUNBLGtCQUFBLENBQUEsT0FBQSxHQUFBLE1BQUEsQ0FBQSxJQUFBLENBQUEsR0FBQSxDQUFBOztBQUVBLGlCQUFBLENBQUEsSUFBQSxDQUFBLGdCQUFBLEdBQUEsWUFBQSxDQUFBLFNBQUEsR0FBQSxVQUFBLEVBQUEsTUFBQSxDQUFBLENBQ0EsSUFBQSxDQUFBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsdUJBQUEsQ0FBQSxHQUFBLENBQUEsMkJBQUEsRUFBQSxRQUFBLENBQUEsSUFBQSxDQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FDQSxDQUFBO0tBQ0EsQ0FBQTtDQUVBLENBQUEsQ0FBQTs7QUFJQSxHQUFBLENBQUEsTUFBQSxDQUFBLGFBQUEsRUFBQSxZQUFBO0FBQ0EsV0FBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLFlBQUEsS0FBQSxLQUFBLEtBQUEsRUFBQTtBQUNBLG1CQUFBLGFBQUEsQ0FBQTtTQUNBLE1BQUE7QUFDQSxtQkFBQSxXQUFBLENBQUE7U0FDQTtLQUNBLENBQUE7Q0FDQSxDQUFBLENBQUE7O0FDbkVBLFlBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FDQSxLQUFBLENBQUEsVUFBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLGtCQUFBO0FBQ0EsbUJBQUEsRUFBQSwyQ0FBQTtBQUNBLGtCQUFBLEVBQUEsMkJBQUE7QUFDQSxlQUFBLEVBQUE7QUFDQSxrQkFBQSxFQUFBLGdCQUFBLE1BQUEsRUFBQTtBQUNBLHVCQUFBLE1BQUEsQ0FBQSxZQUFBLEVBQUEsQ0FBQTthQUNBO0FBQ0EsdUJBQUEsRUFBQSxxQkFBQSxNQUFBLEVBQUE7QUFDQSx1QkFBQSxNQUFBLENBQUEsV0FBQSxDQUFBO2FBQ0E7U0FDQTtLQUNBLENBQUEsQ0FDQSxLQUFBLENBQUEsZUFBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLFdBQUE7QUFDQSxtQkFBQSxFQUFBLGdEQUFBO0FBQ0Esa0JBQUEsRUFBQSwyQkFBQTtLQUNBLENBQUEsQ0FBQTtDQUNBLENBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsVUFBQSxDQUFBLDJCQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsV0FBQSxFQUFBLFlBQUEsRUFBQSxNQUFBLEVBQUEsV0FBQSxFQUFBLE1BQUEsRUFBQTtBQUNBLFVBQUEsQ0FBQSxNQUFBLEdBQUEsTUFBQSxDQUFBOztBQUVBLFFBQUEsWUFBQSxDQUFBLE9BQUEsRUFBQTtBQUNBLGNBQUEsQ0FBQSxRQUFBLENBQUEsWUFBQSxDQUFBLE9BQUEsQ0FBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsU0FBQSxHQUFBLEtBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFdBQUEsR0FBQSxVQUFBLE9BQUEsRUFBQTs7O0FBR0EsbUJBQUEsQ0FBQSxPQUFBLENBQUEsQ0FBQTs7QUFFQSxjQUFBLENBQUEsTUFBQSxDQUFBLE9BQUEsQ0FBQSxVQUFBLEtBQUEsRUFBQSxHQUFBLEVBQUE7QUFDQSxnQkFBQSxLQUFBLENBQUEsR0FBQSxLQUFBLE9BQUEsRUFBQTtBQUNBLHVCQUFBLE1BQUEsQ0FBQSxNQUFBLENBQUEsTUFBQSxDQUFBLEdBQUEsRUFBQSxDQUFBLENBQUEsQ0FBQTthQUNBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxVQUFBLENBQUEsU0FBQSxHQUFBLFlBQUE7QUFDQSxjQUFBLENBQUEsU0FBQSxDQUFBLE1BQUEsQ0FBQSxTQUFBLENBQUEsQ0FBQTtLQUNBLENBQUE7Q0FDQSxDQUFBLENBQUE7O0FDakRBLFlBQUEsQ0FBQTtBQUNBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUNBLEtBQUEsQ0FBQSxZQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEscUJBQUE7QUFDQSxtQkFBQSxFQUFBLCtDQUFBO0FBQ0Esa0JBQUEsRUFBQSw2QkFBQTtLQUNBLENBQUEsQ0FDQSxLQUFBLENBQUEsaUJBQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxhQUFBO0FBQ0EsbUJBQUEsRUFBQSxvREFBQTtBQUNBLGtCQUFBLEVBQUEsNkJBQUE7S0FDQSxDQUFBLENBQUE7Q0FDQSxDQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFVBQUEsQ0FBQSw2QkFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLFlBQUEsRUFBQSxLQUFBLEVBQUEsY0FBQSxFQUFBOztBQUVBLGtCQUFBLENBQUEsUUFBQSxFQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsT0FBQSxFQUFBO0FBQ0EsY0FBQSxDQUFBLFFBQUEsR0FBQSxPQUFBLENBQUE7S0FDQSxDQUFBLENBQUE7O0FBR0EsUUFBQSxZQUFBLENBQUEsU0FBQSxFQUFBO0FBQ0Esc0JBQUEsQ0FBQSxXQUFBLENBQUEsWUFBQSxDQUFBLFNBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLElBQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsV0FBQSxHQUFBLElBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBOztBQUVBLFVBQUEsQ0FBQSxXQUFBLEdBQUEsWUFBQTtBQUNBLHNCQUFBLENBQUEsV0FBQSxDQUFBLE1BQUEsQ0FBQSxXQUFBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLGFBQUEsR0FBQSxVQUFBLE9BQUEsRUFBQTtBQUNBLGNBQUEsQ0FBQSxRQUFBLENBQUEsT0FBQSxDQUFBLFVBQUEsWUFBQSxFQUFBO0FBQ0EsZ0JBQUEsT0FBQSxDQUFBLEdBQUEsS0FBQSxZQUFBLENBQUEsR0FBQSxFQUFBO0FBQ0Esb0JBQUEsS0FBQSxHQUFBLE1BQUEsQ0FBQSxRQUFBLENBQUEsT0FBQSxDQUFBLFlBQUEsQ0FBQSxDQUFBO0FBQ0EsdUJBQUEsTUFBQSxDQUFBLFFBQUEsQ0FBQSxNQUFBLENBQUEsS0FBQSxFQUFBLENBQUEsQ0FBQSxDQUFBO2FBQ0E7U0FDQSxDQUFBLENBQUE7QUFDQSxzQkFBQSxDQUFBLGFBQUEsQ0FBQSxPQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7S0FDQSxDQUFBO0NBRUEsQ0FBQSxDQUFBOztBQzFDQSxHQUFBLENBQUEsT0FBQSxDQUFBLGdCQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUE7O0FBRUEsV0FBQTs7QUFFQSxnQkFBQSxFQUFBLG9CQUFBO0FBQ0EsbUJBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxlQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxRQUFBLEVBQUE7QUFDQSx1QkFBQSxRQUFBLENBQUEsSUFBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7O0FBRUEsdUJBQUEsRUFBQSx5QkFBQSxRQUFBLEVBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsR0FBQSxDQUFBLGtCQUFBLEdBQUEsUUFBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsdUJBQUEsUUFBQSxDQUFBLElBQUEsQ0FBQTthQUNBLENBQUEsQ0FBQTtTQUNBOztBQUVBLHNCQUFBLEVBQUEsd0JBQUEsRUFBQSxFQUFBO0FBQ0EsbUJBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxnQkFBQSxHQUFBLEVBQUEsR0FBQSxVQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxRQUFBLEVBQUE7QUFDQSx1QkFBQSxRQUFBLENBQUEsSUFBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7O0FBRUEsbUJBQUEsRUFBQSxxQkFBQSxFQUFBLEVBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsR0FBQSxDQUFBLGdCQUFBLEdBQUEsRUFBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsdUJBQUEsUUFBQSxDQUFBLElBQUEsQ0FBQTthQUNBLENBQUEsQ0FBQTtTQUNBOztBQUVBLG1CQUFBLEVBQUEscUJBQUEsRUFBQSxFQUFBO0FBQ0EsbUJBQUEsS0FBQSxDQUFBLElBQUEsQ0FBQSxnQkFBQSxHQUFBLEVBQUEsQ0FBQSxDQUFBO1NBQ0E7O0FBRUEsbUJBQUEsRUFBQSxxQkFBQSxJQUFBLEVBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsR0FBQSxDQUFBLGVBQUEsRUFBQSxJQUFBLENBQUEsQ0FBQTtTQUNBOztBQUVBLHFCQUFBLEVBQUEsdUJBQUEsRUFBQSxFQUFBO0FBQ0EsbUJBQUEsS0FBQSxVQUFBLENBQUEsZ0JBQUEsR0FBQSxFQUFBLENBQUEsQ0FBQTtTQUNBOztBQUVBLGlCQUFBLEVBQUEscUJBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsR0FBQSxDQUFBLGtCQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxRQUFBLEVBQUE7QUFDQSx1QkFBQSxRQUFBLENBQUEsSUFBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7O0FBRUEsb0JBQUEsRUFBQSxzQkFBQSxTQUFBLEVBQUEsTUFBQSxFQUFBO0FBQ0EsbUJBQUEsS0FBQSxDQUFBLElBQUEsQ0FBQSxnQkFBQSxHQUFBLFNBQUEsR0FBQSxVQUFBLEVBQUEsTUFBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsdUJBQUEsUUFBQSxDQUFBLElBQUEsQ0FBQTthQUNBLENBQUEsQ0FBQTtTQUNBOztLQUVBLENBQUE7Q0FHQSxDQUFBLENBQUE7QUN2REEsWUFBQSxDQUFBO0FBQ0EsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTtBQUNBLGtCQUFBLENBQ0EsS0FBQSxDQUFBLFVBQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxHQUFBO0FBQ0EsbUJBQUEsRUFBQSwyQkFBQTtBQUNBLGtCQUFBLEVBQUEsb0JBQUE7S0FDQSxDQUFBLENBQ0EsS0FBQSxDQUFBLGVBQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxhQUFBO0FBQ0EsbUJBQUEsRUFBQSw4QkFBQTtBQUNBLGtCQUFBLEVBQUEsb0JBQUE7S0FDQSxDQUFBLENBQ0EsS0FBQSxDQUFBLHFCQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsbUJBQUE7QUFDQSxtQkFBQSxFQUFBLGtDQUFBO0FBQ0Esa0JBQUEsRUFBQSxvQkFBQTtLQUNBLENBQUEsQ0FBQTtDQUVBLENBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsVUFBQSxDQUFBLG9CQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsWUFBQSxFQUFBLGNBQUEsRUFBQTs7QUFFQSxVQUFBLENBQUEsZUFBQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLE9BQUEsR0FBQSxDQUFBLE9BQUEsRUFBQSxLQUFBLENBQUEsQ0FBQTtBQUNBLFVBQUEsQ0FBQSxNQUFBLEdBQUEsRUFBQSxDQUFBOztBQUVBLGtCQUFBLENBQUEsU0FBQSxFQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsTUFBQSxFQUFBO0FBQ0EsY0FBQSxDQUFBLE1BQUEsR0FBQSxNQUFBLENBQUE7S0FDQSxDQUFBLENBQUE7O0FBRUEsUUFBQSxZQUFBLENBQUEsZUFBQSxFQUFBO0FBQ0Esc0JBQUEsQ0FBQSxlQUFBLENBQUEsWUFBQSxDQUFBLGVBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLFFBQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsZUFBQSxHQUFBLFFBQUEsQ0FBQTtBQUNBLGtCQUFBLENBQUEsZUFBQSxHQUFBLFlBQUEsQ0FBQSxlQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQTs7QUFFQSxRQUFBLFlBQUEsQ0FBQSxTQUFBLEVBQUE7QUFDQSxzQkFBQSxDQUFBLGNBQUEsQ0FBQSxZQUFBLENBQUEsU0FBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsT0FBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxjQUFBLEdBQUEsT0FBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBOztBQUVBLHNCQUFBLENBQUEsV0FBQSxDQUFBLFlBQUEsQ0FBQSxTQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxJQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLFdBQUEsR0FBQSxJQUFBLENBQUE7O0FBRUEsa0JBQUEsQ0FBQSxNQUFBLEdBQUEsRUFBQSxDQUFBOztBQUVBLGlCQUFBLElBQUEsQ0FBQSxHQUFBLENBQUEsRUFBQSxDQUFBLEdBQUEsTUFBQSxDQUFBLFdBQUEsQ0FBQSxRQUFBLENBQUEsTUFBQSxFQUFBLENBQUEsRUFBQSxFQUFBO0FBQ0Esc0JBQUEsQ0FBQSxNQUFBLENBQUEsSUFBQSxDQUFBO0FBQ0EseUJBQUEsRUFBQSxNQUFBLENBQUEsV0FBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBLENBQUE7aUJBQ0EsQ0FBQSxDQUFBO2FBQ0E7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxXQUFBLEdBQUEsVUFBQSxFQUFBLEVBQUE7QUFDQSxzQkFBQSxDQUFBLFdBQUEsQ0FBQSxFQUFBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFVBQUEsR0FBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLFlBQUEsS0FBQSxHQUFBLENBQUEsRUFBQTtBQUNBLG1CQUFBLElBQUEsQ0FBQTtTQUNBLE1BQUE7QUFDQSxtQkFBQSxLQUFBLENBQUE7U0FDQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFVBQUEsR0FBQTtBQUNBLGVBQUEsRUFBQSxJQUFBO0FBQ0Esa0JBQUEsRUFBQSxZQUFBLENBQUEsU0FBQTtBQUNBLGFBQUEsRUFBQSxDQUFBO0FBQ0EsY0FBQSxFQUFBLEVBQUE7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxjQUFBLEdBQUEsS0FBQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxNQUFBLENBQUEsZ0JBQUEsRUFBQSxZQUFBO0FBQ0EsY0FBQSxDQUFBLG1CQUFBLEdBQUEsTUFBQSxDQUFBLGNBQUEsR0FBQSxXQUFBLEdBQUEsWUFBQSxDQUFBO0tBQ0EsQ0FBQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxZQUFBLEdBQUEsVUFBQSxNQUFBLEVBQUE7O0FBRUEsc0JBQUEsQ0FBQSxZQUFBLENBQUEsWUFBQSxDQUFBLFNBQUEsRUFBQSxNQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxNQUFBLEVBQUE7QUFDQSxtQkFBQSxDQUFBLEdBQUEsQ0FBQSxxQkFBQSxFQUFBLE1BQUEsQ0FBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBOztBQUVBLGNBQUEsQ0FBQSxVQUFBLEdBQUE7QUFDQSxtQkFBQSxFQUFBLElBQUE7QUFDQSxzQkFBQSxFQUFBLFlBQUEsQ0FBQSxTQUFBO0FBQ0EsaUJBQUEsRUFBQSxDQUFBO0FBQ0Esa0JBQUEsRUFBQSxFQUFBO1NBQ0EsQ0FBQTs7QUFFQSxjQUFBLENBQUEsY0FBQSxHQUFBLEtBQUEsQ0FBQTtLQUNBLENBQUE7Q0FDQSxDQUFBLENBQUE7O0FDaEdBLEdBQUEsQ0FBQSxPQUFBLENBQUEsZUFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBOztBQUVBLFdBQUE7O0FBRUEsc0JBQUEsRUFBQSx3QkFBQSxNQUFBLEVBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUE7QUFDQSxtQkFBQSxFQUFBLGFBQUE7QUFDQSxzQkFBQSxFQUFBLEtBQUE7QUFDQSxzQkFBQSxFQUFBLE1BQUE7YUFDQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsdUJBQUEsR0FBQSxDQUFBLElBQUEsQ0FBQTthQUNBLENBQUEsU0FBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsdUJBQUEsQ0FBQSxLQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7QUFDQSx1QkFBQSxHQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FDQTs7QUFFQSxpQkFBQSxFQUFBLHFCQUFBO0FBQ0EsbUJBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxnQkFBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsdUJBQUEsR0FBQSxDQUFBLElBQUEsQ0FBQTthQUNBLENBQUEsU0FBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsdUJBQUEsQ0FBQSxLQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7QUFDQSx1QkFBQSxHQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FDQTtLQUNBLENBQUE7Q0FDQSxDQUFBLENBQUE7QUMxQkEsWUFBQSxDQUFBOzs7OztBQUtBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUNBLEtBQUEsQ0FBQSxRQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsZ0JBQUE7QUFDQSxtQkFBQSxFQUFBLHVCQUFBO0FBQ0Esa0JBQUEsRUFBQSxrQkFBQTtLQUNBLENBQUEsQ0FBQTtDQUNBLENBQUEsQ0FBQTs7QUFHQSxHQUFBLENBQUEsVUFBQSxDQUFBLGtCQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsWUFBQSxFQUFBLGFBQUEsRUFBQTtBQUNBLFVBQUEsQ0FBQSxNQUFBLEdBQUEsRUFBQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLFFBQUEsR0FBQSxFQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsYUFBQSxHQUFBLEVBQUEsQ0FBQTs7QUFFQSxVQUFBLENBQUEsY0FBQSxHQUFBLENBQ0EsRUFBQSxJQUFBLEVBQUEsSUFBQSxFQUFBLEtBQUEsRUFBQSxFQUFBLEVBQUEsRUFDQSxFQUFBLElBQUEsRUFBQSxLQUFBLEVBQUEsS0FBQSxFQUFBLEVBQUEsRUFBQSxFQUNBLEVBQUEsSUFBQSxFQUFBLE1BQUEsRUFBQSxLQUFBLEVBQUEsR0FBQSxFQUFBLEVBQ0EsRUFBQSxJQUFBLEVBQUEsTUFBQSxFQUFBLEtBQUEsRUFBQSxHQUFBLEVBQUEsQ0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxjQUFBLEdBQUEsQ0FDQSxFQUFBLElBQUEsRUFBQSxLQUFBLEVBQUEsS0FBQSxFQUFBLEVBQUEsRUFBQSxFQUNBLEVBQUEsSUFBQSxFQUFBLE1BQUEsRUFBQSxLQUFBLEVBQUEsR0FBQSxFQUFBLEVBQ0EsRUFBQSxJQUFBLEVBQUEsTUFBQSxFQUFBLEtBQUEsRUFBQSxHQUFBLEVBQUEsRUFDQSxFQUFBLElBQUEsRUFBQSxlQUFBLEVBQUEsS0FBQSxFQUFBLEVBQUEsRUFBQSxDQUNBLENBQUE7O0FBRUEsYUFBQSxXQUFBLEdBQUE7QUFDQSxjQUFBLENBQUEsUUFBQSxHQUFBO0FBQ0EsaUJBQUEsRUFBQSxFQUFBO0FBQ0Esa0JBQUEsRUFBQSxFQUFBO0FBQ0Esa0JBQUEsRUFBQSxFQUFBO0FBQ0Esc0JBQUEsRUFBQSxFQUFBLEdBQUEsRUFBQSxFQUFBLEVBQUEsR0FBQSxFQUFBLEVBQUEsRUFBQTtBQUNBLG9CQUFBLEVBQUEsRUFBQTtTQUNBLENBQUE7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxZQUFBLEdBQUEsWUFBQTtBQUNBLHFCQUFBLENBQUEsU0FBQSxFQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsTUFBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxNQUFBLEdBQUEsTUFBQSxDQUFBO1NBQ0EsQ0FBQSxTQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSxtQkFBQSxDQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQTtBQUNBLG1CQUFBLEdBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLGdCQUFBLEdBQUEsWUFBQTtBQUNBLHFCQUFBLENBQUEsY0FBQSxDQUFBLE1BQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxRQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLGFBQUEsR0FBQSxRQUFBLENBQUE7QUFDQSxtQkFBQSxDQUFBLEdBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQTtTQUNBLENBQUEsU0FBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsbUJBQUEsQ0FBQSxLQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7QUFDQSxtQkFBQSxHQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxlQUFBLEdBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxZQUFBLEdBQUEsR0FBQSxNQUFBLENBQUEsUUFBQSxDQUFBLE1BQUEsQ0FBQSxPQUFBLENBQUEsS0FBQSxDQUFBLENBQUE7O0FBRUEsWUFBQSxHQUFBLEdBQUEsQ0FBQSxDQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLFFBQUEsQ0FBQSxNQUFBLENBQUEsTUFBQSxDQUFBLEdBQUEsRUFBQSxDQUFBLENBQUEsQ0FBQTtTQUNBLE1BQUE7QUFDQSxrQkFBQSxDQUFBLFFBQUEsQ0FBQSxNQUFBLENBQUEsSUFBQSxDQUFBLEtBQUEsQ0FBQSxDQUFBO1NBQ0E7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxXQUFBLEdBQUEsWUFBQTtBQUNBLG1CQUFBLEVBQUEsQ0FBQTtBQUNBLGNBQUEsQ0FBQSxhQUFBLEdBQUEsRUFBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxlQUFBLEVBQUEsQ0FBQTtBQUNBLFVBQUEsQ0FBQSxZQUFBLEVBQUEsQ0FBQTs7QUFFQSxRQUFBLFlBQUEsQ0FBQSxLQUFBLEVBQUE7QUFDQSxjQUFBLENBQUEsUUFBQSxDQUFBLEtBQUEsR0FBQSxZQUFBLENBQUEsS0FBQSxDQUFBO0FBQ0EsY0FBQSxDQUFBLGdCQUFBLEVBQUEsQ0FBQTtLQUNBO0NBQ0EsQ0FBQSxDQUFBO0FDckZBLEdBQUEsQ0FBQSxPQUFBLENBQUEsZUFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBOztBQUVBLFdBQUE7O0FBRUEscUJBQUEsRUFBQSx1QkFBQSxZQUFBLEVBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsSUFBQSxDQUFBLFlBQUEsRUFBQSxZQUFBLENBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxRQUFBLEVBQUE7QUFDQSx1QkFBQSxRQUFBLENBQUEsSUFBQSxDQUFBO2FBQ0EsQ0FBQSxTQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSx1QkFBQSxDQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQTtBQUNBLHVCQUFBLEdBQUEsQ0FBQTthQUNBLENBQUEsQ0FBQTtTQUNBOztLQUVBLENBQUE7Q0FFQSxDQUFBLENBQUE7QUNoQkEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTtBQUNBLGtCQUFBLENBQ0EsS0FBQSxDQUFBLFFBQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxTQUFBO0FBQ0EsbUJBQUEsRUFBQSx1QkFBQTtBQUNBLGtCQUFBLEVBQUEsWUFBQTtLQUNBLENBQUEsQ0FBQTtDQUNBLENBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsVUFBQSxDQUFBLFlBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxXQUFBLEVBQUEsTUFBQSxFQUFBLGFBQUEsRUFBQTs7QUFFQSxVQUFBLENBQUEsS0FBQSxHQUFBLElBQUEsQ0FBQTtBQUNBLFVBQUEsQ0FBQSxNQUFBLEdBQUEsRUFBQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxVQUFBLEdBQUEsVUFBQSxNQUFBLEVBQUE7QUFDQSxjQUFBLENBQUEsS0FBQSxHQUFBLElBQUEsQ0FBQTs7QUFFQSxxQkFBQSxDQUFBLGFBQUEsQ0FBQSxNQUFBLENBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxJQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLEVBQUEsQ0FBQSxNQUFBLENBQUEsQ0FBQTtBQUNBLG1CQUFBLFdBQUEsQ0FBQSxlQUFBLEVBQUEsQ0FBQTtTQUNBLENBQUEsU0FDQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxLQUFBLEdBQUEsOENBQUEsQ0FBQTtBQUNBLG1CQUFBLENBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTtDQUVBLENBQUEsQ0FBQTtBQzVCQSxZQUFBLENBQUE7QUFDQSxHQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FDQSxLQUFBLENBQUEsU0FBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLGlCQUFBO0FBQ0EsbUJBQUEsRUFBQSx5Q0FBQTtBQUNBLGtCQUFBLEVBQUEsMEJBQUE7S0FDQSxDQUFBLENBQ0EsS0FBQSxDQUFBLGNBQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxVQUFBO0FBQ0EsbUJBQUEsRUFBQSw4Q0FBQTtBQUNBLGtCQUFBLEVBQUEsMEJBQUE7S0FDQSxDQUFBLENBQUE7Q0FDQSxDQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFVBQUEsQ0FBQSwwQkFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLFlBQUEsRUFBQSxLQUFBLEVBQUE7O0FBRUEsU0FBQSxDQUFBLEdBQUEsQ0FBQSxZQUFBLENBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxRQUFBLEVBQUE7QUFDQSxjQUFBLENBQUEsS0FBQSxHQUFBLFFBQUEsQ0FBQSxJQUFBLENBQUE7S0FDQSxDQUFBLENBQUE7O0FBRUEsUUFBQSxDQUFBLENBQUEsWUFBQSxDQUFBLE1BQUEsRUFBQTtBQUNBLGFBQUEsQ0FBQSxHQUFBLENBQUEsYUFBQSxHQUFBLFlBQUEsQ0FBQSxNQUFBLENBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxRQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLFFBQUEsR0FBQSxRQUFBLENBQUEsSUFBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0E7OztBQUdBLFVBQUEsQ0FBQSxRQUFBLEdBQUEsWUFBQTtBQUNBLGFBQUEsQ0FBQSxHQUFBLENBQUEsWUFBQSxFQUFBLE1BQUEsQ0FBQSxRQUFBLENBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxRQUFBLEVBQUE7QUFDQSxtQkFBQSxDQUFBLEdBQUEsQ0FBQSxRQUFBLENBQUEsSUFBQSxDQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBOzs7QUFHQSxVQUFBLENBQUEsVUFBQSxHQUFBLFVBQUEsSUFBQSxFQUFBO0FBQ0EsY0FBQSxDQUFBLEtBQUEsQ0FBQSxPQUFBLENBQUEsVUFBQSxTQUFBLEVBQUE7QUFDQSxnQkFBQSxJQUFBLENBQUEsR0FBQSxLQUFBLFNBQUEsQ0FBQSxHQUFBLEVBQUE7QUFDQSxvQkFBQSxLQUFBLEdBQUEsTUFBQSxDQUFBLEtBQUEsQ0FBQSxPQUFBLENBQUEsU0FBQSxDQUFBLENBQUE7QUFDQSx1QkFBQSxNQUFBLENBQUEsS0FBQSxDQUFBLE1BQUEsQ0FBQSxLQUFBLEVBQUEsQ0FBQSxDQUFBLENBQUE7YUFDQTtTQUNBLENBQUEsQ0FBQTs7QUFFQSxhQUFBLFVBQUEsQ0FBQSxhQUFBLEdBQUEsSUFBQSxDQUFBLEdBQUEsQ0FBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLFFBQUEsRUFBQTtBQUNBLG1CQUFBLENBQUEsR0FBQSxDQUFBLFFBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBLENBQUE7Q0FFQSxDQUFBLENBQUE7O0FDcERBLFlBQUEsQ0FBQTtBQUNBLEdBQUEsQ0FBQSxPQUFBLENBQUEsaUJBQUEsRUFBQSxZQUFBOztBQUVBLFFBQUEsa0JBQUEsR0FBQSw0QkFBQSxHQUFBLEVBQUE7QUFDQSxlQUFBLEdBQUEsQ0FBQSxJQUFBLENBQUEsS0FBQSxDQUFBLElBQUEsQ0FBQSxNQUFBLEVBQUEsR0FBQSxHQUFBLENBQUEsTUFBQSxDQUFBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsUUFBQSxTQUFBLEdBQUEsQ0FDQSxlQUFBLEVBQ0EsdUJBQUEsRUFDQSxzQkFBQSxFQUNBLHVCQUFBLEVBQ0EseURBQUEsRUFDQSwwQ0FBQSxDQUNBLENBQUE7O0FBRUEsV0FBQTtBQUNBLGlCQUFBLEVBQUEsU0FBQTtBQUNBLHlCQUFBLEVBQUEsNkJBQUE7QUFDQSxtQkFBQSxrQkFBQSxDQUFBLFNBQUEsQ0FBQSxDQUFBO1NBQ0E7S0FDQSxDQUFBO0NBRUEsQ0FBQSxDQUFBO0FDdkJBLFlBQUEsQ0FBQTs7QUNBQSxZQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLE9BQUEsQ0FBQSxRQUFBLEVBQUEsVUFBQSxXQUFBLEVBQUEsS0FBQSxFQUFBOzs7QUFHQSxRQUFBLFlBQUEsR0FBQSx3QkFBQTtBQUNBLGVBQUEsV0FBQSxDQUFBLGVBQUEsRUFBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLElBQUEsRUFBQTtBQUNBLGdCQUFBLEdBQUEsR0FBQSxhQUFBLEdBQUEsSUFBQSxDQUFBLEdBQUEsR0FBQSxZQUFBLENBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsR0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBO1NBQ0EsQ0FBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLFFBQUEsRUFBQTtBQUNBLG1CQUFBLFFBQUEsQ0FBQSxJQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBOzs7QUFHQSxRQUFBLFdBQUEsR0FBQSxxQkFBQSxPQUFBLEVBQUE7QUFDQSxlQUFBLFdBQUEsQ0FBQSxlQUFBLEVBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxJQUFBLEVBQUE7QUFDQSxnQkFBQSxHQUFBLEdBQUEsYUFBQSxHQUFBLElBQUEsQ0FBQSxHQUFBLEdBQUEsVUFBQSxHQUFBLE9BQUEsR0FBQSxTQUFBLENBQUE7QUFDQSxtQkFBQSxLQUFBLFVBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQTtTQUNBLENBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSxtQkFBQSxHQUFBLENBQUEsSUFBQSxDQUFBO1NBQ0EsQ0FBQSxTQUNBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSxtQkFBQSxDQUFBLEdBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQTtBQUNBLG1CQUFBLEdBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsUUFBQSxRQUFBLEdBQUEsa0JBQUEsT0FBQSxFQUFBO0FBQ0EsZUFBQSxXQUFBLENBQUEsZUFBQSxFQUFBLENBQ0EsSUFBQSxDQUFBLFVBQUEsSUFBQSxFQUFBO0FBQ0EsZ0JBQUEsR0FBQSxHQUFBLGFBQUEsR0FBQSxJQUFBLENBQUEsR0FBQSxHQUFBLFVBQUEsR0FBQSxPQUFBLENBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsR0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBO1NBQ0EsQ0FBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLG1CQUFBLEdBQUEsQ0FBQSxJQUFBLENBQUE7U0FDQSxDQUFBLFNBQ0EsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLG1CQUFBLENBQUEsR0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBO0FBQ0EsbUJBQUEsR0FBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxRQUFBLFNBQUEsR0FBQSxtQkFBQSxLQUFBLEVBQUE7QUFDQSxlQUFBLFdBQUEsQ0FBQSxlQUFBLEVBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxJQUFBLEVBQUE7QUFDQSxnQkFBQSxHQUFBLEdBQUEsYUFBQSxHQUFBLElBQUEsQ0FBQSxHQUFBLEdBQUEsVUFBQSxHQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUE7QUFDQSxtQkFBQSxDQUFBLEdBQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsR0FBQSxFQUFBLEtBQUEsQ0FBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxXQUFBO0FBQ0Esb0JBQUEsRUFBQSxZQUFBO0FBQ0EsbUJBQUEsRUFBQSxXQUFBO0FBQ0EsZ0JBQUEsRUFBQSxRQUFBO0FBQ0EsaUJBQUEsRUFBQSxTQUFBO0tBQ0EsQ0FBQTtDQUNBLENBQUEsQ0FBQTs7QUM3REEsWUFBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxPQUFBLENBQUEsT0FBQSxFQUFBLFVBQUEsV0FBQSxFQUFBLEtBQUEsRUFBQTs7QUFFQSxRQUFBLFdBQUEsR0FBQSx1QkFBQTtBQUNBLGVBQUEsV0FBQSxDQUFBLGVBQUEsRUFBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLElBQUEsRUFBQTtBQUNBLGdCQUFBLEdBQUEsR0FBQSxhQUFBLENBQUE7QUFDQSxtQkFBQSxDQUFBLEdBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7U0FDQSxDQUFBLENBQ0EsSUFBQSxDQUFBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsbUJBQUEsUUFBQSxDQUFBLElBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsV0FBQTtBQUNBLG1CQUFBLEVBQUEsV0FBQTtLQUNBLENBQUE7Q0FDQSxDQUFBLENBQUE7Ozs7QUNoQkEsWUFBQSxDQUFBO0FBQ0EsR0FBQSxDQUFBLFNBQUEsQ0FBQSxlQUFBLEVBQUEsWUFBQTtBQUNBLFdBQUE7QUFDQSxnQkFBQSxFQUFBLEdBQUE7QUFDQSxtQkFBQSxFQUFBLHlEQUFBO0tBQ0EsQ0FBQTtDQUNBLENBQUEsQ0FBQTtBQ1JBLFlBQUEsQ0FBQTtBQUNBLEdBQUEsQ0FBQSxTQUFBLENBQUEsUUFBQSxFQUFBLFVBQUEsVUFBQSxFQUFBLFdBQUEsRUFBQSxXQUFBLEVBQUEsTUFBQSxFQUFBOzs7OztBQUtBLFdBQUE7QUFDQSxnQkFBQSxFQUFBLEdBQUE7QUFDQSxhQUFBLEVBQUEsRUFBQTtBQUNBLG1CQUFBLEVBQUEseUNBQUE7QUFDQSxZQUFBLEVBQUEsY0FBQSxLQUFBLEVBQUE7QUFDQSxpQkFBQSxDQUFBLEtBQUEsR0FBQSxDQUNBLEVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQSxLQUFBLEVBQUEsVUFBQSxFQUFBLEVBQ0EsRUFBQSxLQUFBLEVBQUEsTUFBQSxFQUFBLEtBQUEsRUFBQSxNQUFBLEVBQUEsRUFDQSxFQUFBLEtBQUEsRUFBQSxlQUFBLEVBQUEsS0FBQSxFQUFBLGFBQUEsRUFBQSxJQUFBLEVBQUEsSUFBQSxFQUFBLENBQ0EsQ0FBQTtBQUNBLGlCQUFBLENBQUEsVUFBQSxHQUFBLENBQ0EsRUFBQSxLQUFBLEVBQUEsb0JBQUEsRUFBQSxLQUFBLEVBQUEsWUFBQSxFQUFBLEtBQUEsRUFBQSxJQUFBLEVBQUEsRUFDQSxFQUFBLEtBQUEsRUFBQSxrQkFBQSxFQUFBLEtBQUEsRUFBQSxVQUFBLEVBQUEsS0FBQSxFQUFBLElBQUEsRUFBQSxFQUNBLEVBQUEsS0FBQSxFQUFBLGlCQUFBLEVBQUEsS0FBQSxFQUFBLFNBQUEsRUFBQSxLQUFBLEVBQUEsSUFBQSxFQUFBLENBQ0EsQ0FBQTs7QUFFQSxpQkFBQSxDQUFBLElBQUEsR0FBQSxJQUFBLENBQUE7QUFDQSxpQkFBQSxDQUFBLGVBQUEsR0FBQSxJQUFBLENBQUE7O0FBRUEsaUJBQUEsQ0FBQSxVQUFBLEdBQUEsWUFBQTtBQUNBLHVCQUFBLFdBQUEsQ0FBQSxlQUFBLEVBQUEsQ0FBQTthQUNBLENBQUE7O0FBRUEsaUJBQUEsQ0FBQSxPQUFBLEdBQUEsWUFBQTtBQUNBLHVCQUFBLFdBQUEsQ0FBQSxPQUFBLEVBQUEsQ0FBQTthQUNBLENBQUE7O0FBRUEsaUJBQUEsQ0FBQSxNQUFBLEdBQUEsWUFBQTtBQUNBLDJCQUFBLENBQUEsTUFBQSxFQUFBLENBQUEsSUFBQSxDQUFBLFlBQUE7QUFDQSwwQkFBQSxDQUFBLEVBQUEsQ0FBQSxNQUFBLENBQUEsQ0FBQTtpQkFDQSxDQUFBLENBQUE7YUFDQSxDQUFBOztBQUVBLGlCQUFBLENBQUEsTUFBQSxHQUFBLFlBQUE7QUFDQSxzQkFBQSxDQUFBLEVBQUEsQ0FBQSxRQUFBLEVBQUEsRUFBQSxLQUFBLEVBQUEsS0FBQSxDQUFBLGVBQUEsRUFBQSxDQUFBLENBQUE7YUFDQSxDQUFBOztBQUVBLGdCQUFBLE9BQUEsR0FBQSxtQkFBQTtBQUNBLDJCQUFBLENBQUEsZUFBQSxFQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsSUFBQSxFQUFBO0FBQ0EseUJBQUEsQ0FBQSxJQUFBLEdBQUEsSUFBQSxDQUFBO2lCQUNBLENBQUEsQ0FBQTthQUNBLENBQUE7O0FBRUEsZ0JBQUEsVUFBQSxHQUFBLHNCQUFBO0FBQ0EscUJBQUEsQ0FBQSxJQUFBLEdBQUEsSUFBQSxDQUFBO2FBQ0EsQ0FBQTs7QUFHQSxtQkFBQSxFQUFBLENBQUE7O0FBRUEsc0JBQUEsQ0FBQSxHQUFBLENBQUEsV0FBQSxDQUFBLFlBQUEsRUFBQSxPQUFBLENBQUEsQ0FBQTtBQUNBLHNCQUFBLENBQUEsR0FBQSxDQUFBLFdBQUEsQ0FBQSxhQUFBLEVBQUEsVUFBQSxDQUFBLENBQUE7QUFDQSxzQkFBQSxDQUFBLEdBQUEsQ0FBQSxXQUFBLENBQUEsY0FBQSxFQUFBLFVBQUEsQ0FBQSxDQUFBO1NBRUE7O0tBRUEsQ0FBQTtDQUVBLENBQUEsQ0FBQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xudmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdGdWxsc3RhY2tHZW5lcmF0ZWRBcHAnLCBbJ3VpLnJvdXRlcicsICdmc2FQcmVCdWlsdCcsICd1aS5ib290c3RyYXAnXSk7XG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCR1cmxSb3V0ZXJQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIpIHtcbiAgICAvLyBUaGlzIHR1cm5zIG9mZiBoYXNoYmFuZyB1cmxzICgvI2Fib3V0KSBhbmQgY2hhbmdlcyBpdCB0byBzb21ldGhpbmcgbm9ybWFsICgvYWJvdXQpXG4gICAgJGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpO1xuICAgIC8vIElmIHdlIGdvIHRvIGEgVVJMIHRoYXQgdWktcm91dGVyIGRvZXNuJ3QgaGF2ZSByZWdpc3RlcmVkLCBnbyB0byB0aGUgXCIvXCIgdXJsLlxuICAgICR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoJy8nKTtcbn0pO1xuXG5cbi8vIFRoaXMgYXBwLnJ1biBpcyBmb3IgY29udHJvbGxpbmcgYWNjZXNzIHRvIHNwZWNpZmljIHN0YXRlcy5cbmFwcC5ydW4oZnVuY3Rpb24gKCRyb290U2NvcGUsIEF1dGhTZXJ2aWNlLCAkc3RhdGUpIHtcblxuICAgIC8vIFRoZSBnaXZlbiBzdGF0ZSByZXF1aXJlcyBhbiBhdXRoZW50aWNhdGVkIHVzZXIuXG4gICAgdmFyIGRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGggPSBmdW5jdGlvbiAoc3RhdGUpIHtcbiAgICAgICAgcmV0dXJuIHN0YXRlLmRhdGEgJiYgc3RhdGUuZGF0YS5hdXRoZW50aWNhdGU7XG4gICAgfTtcblxuICAgIC8vICRzdGF0ZUNoYW5nZVN0YXJ0IGlzIGFuIGV2ZW50IGZpcmVkXG4gICAgLy8gd2hlbmV2ZXIgdGhlIHByb2Nlc3Mgb2YgY2hhbmdpbmcgYSBzdGF0ZSBiZWdpbnMuXG4gICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24gKGV2ZW50LCB0b1N0YXRlLCB0b1BhcmFtcykge1xuXG4gICAgICAgIGlmICghZGVzdGluYXRpb25TdGF0ZVJlcXVpcmVzQXV0aCh0b1N0YXRlKSkge1xuICAgICAgICAgICAgLy8gVGhlIGRlc3RpbmF0aW9uIHN0YXRlIGRvZXMgbm90IHJlcXVpcmUgYXV0aGVudGljYXRpb25cbiAgICAgICAgICAgIC8vIFNob3J0IGNpcmN1aXQgd2l0aCByZXR1cm4uXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCkpIHtcbiAgICAgICAgICAgIC8vIFRoZSB1c2VyIGlzIGF1dGhlbnRpY2F0ZWQuXG4gICAgICAgICAgICAvLyBTaG9ydCBjaXJjdWl0IHdpdGggcmV0dXJuLlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2FuY2VsIG5hdmlnYXRpbmcgdG8gbmV3IHN0YXRlLlxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgICAgIC8vIElmIGEgdXNlciBpcyByZXRyaWV2ZWQsIHRoZW4gcmVuYXZpZ2F0ZSB0byB0aGUgZGVzdGluYXRpb25cbiAgICAgICAgICAgIC8vICh0aGUgc2Vjb25kIHRpbWUsIEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpIHdpbGwgd29yaylcbiAgICAgICAgICAgIC8vIG90aGVyd2lzZSwgaWYgbm8gdXNlciBpcyBsb2dnZWQgaW4sIGdvIHRvIFwibG9naW5cIiBzdGF0ZS5cbiAgICAgICAgICAgIGlmICh1c2VyKSB7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKHRvU3RhdGUubmFtZSwgdG9QYXJhbXMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2xvZ2luJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgfSk7XG5cbn0pOyIsImFwcC5mYWN0b3J5KCdDYXJ0RmFjdG9yeScsIGZ1bmN0aW9uICgkaHR0cCkge1xuXG4gICAgcmV0dXJuIHtcblxuICAgICAgICBnZXRDdXJyZW50VXNlcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8gdGVtcG9yYXJ5IHVzZXIgd29ya2Zsb3dcbiAgICAgICAgICAgIC8vIGdldCBjdXJyZW50IHVzZXIgZnJvbSBjb29raWUgaWRcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvdXNlcnMvY3VycmVudHVzZXIvJykudGhlbihmdW5jdGlvbihyZXMpe1xuICAgICAgICAgICAgICAgIGlmIChyZXMuZGF0YSlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5kYXRhWzBdO1xuICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgIHJldHVybiBlcnI7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBkZWxldGVQcm9kdWN0SW5DYXJ0OiBmdW5jdGlvbiAodXNlcklELCBvcmRlcklELCBwcm9kdWN0SUQpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5kZWxldGUoJy9hcGkvdXNlcnMvJysgdXNlcklEICsgJy9vcmRlcnMvJyArIG9yZGVySUQgKyAnL3Byb2R1Y3RzLycgKyBwcm9kdWN0SUQpXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXMuZGF0YTtcbiAgICAgICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXJyO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH0sXG5cbiAgICAgICAgcHJpY2VTdW06IGZ1bmN0aW9uIChjdXJyZW50T3JkZXIpIHtcbiAgICAgICAgICAgIHZhciB0b3RhbCA9IDAuMDtcblxuICAgICAgICAgICAgY3VycmVudE9yZGVyLnByb2R1Y3RzLmZvckVhY2goZnVuY3Rpb24oZWxlbSkge1xuICAgICAgICAgICAgICAgIHRvdGFsICs9IGVsZW0uaWQucHJpY2UgKiBlbGVtLnF1YW50aXR5O1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiB0b3RhbDtcbiAgICAgICAgfSxcblxuICAgICAgICBpdGVtQ291bnQ6IGZ1bmN0aW9uIChjdXJyZW50T3JkZXIpIHtcbiAgICAgICAgICAgIHZhciB0b3RhbCA9IDA7XG5cbiAgICAgICAgICAgIGN1cnJlbnRPcmRlci5wcm9kdWN0cy5mb3JFYWNoKGZ1bmN0aW9uKGVsZW0pIHtcbiAgICAgICAgICAgICAgICB0b3RhbCArPSBlbGVtLnF1YW50aXR5O1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiB0b3RhbDtcbiAgICAgICAgfSxcblxuICAgICAgICBzYXZlT3JkZXI6IGZ1bmN0aW9uKHVzZXJJRCwgb3JkZXJJRCwgY3VycmVudE9yZGVyKSB7IFxuICAgICAgICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9hcGkvdXNlcnMvJysgdXNlcklEICsgJy9vcmRlcnMvJyArIG9yZGVySUQsIGN1cnJlbnRPcmRlcikudGhlbihmdW5jdGlvbihyZXMpe1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzLmRhdGE7XG4gICAgICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVycjtcbiAgICAgICAgICAgICAgICB9KTsgICAgICAgXG4gICAgICAgIH1cblxuICAgIH07XG5cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuLy9UaGUgQ29uZmlnIGJlbG93IGRlZmluZXMgdGhlIC9jYXJ0IHN0YXRlLCB3aGljaCB3aWxsXG4vL3Nob3cgYWxsIHByb2R1Y3RzIGluIHRoZSBjYXJ0LlxuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcil7XG4gICAgJHN0YXRlUHJvdmlkZXJcbiAgICAgICAgLnN0YXRlKCdjYXJ0Jywge1xuICAgICAgICAgICAgdXJsOiAnL2NhcnQnLFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jYXJ0L2NhcnQuaHRtbCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnQ2FydENvbnRyb2xsZXInXG4gICAgICAgIH0pO1xufSk7XG5cbmFwcC5jb250cm9sbGVyKCdDYXJ0Q29udHJvbGxlcicsIGZ1bmN0aW9uKCRzY29wZSwgQ2FydEZhY3RvcnkpIHtcbiAgICAvLyB0ZW1wb3JhcnkgdXNlciB3b3JrZmxvd1xuICAgIC8vIGdldCBjdXJyZW50IHVzZXIgZnJvbSBjb29raWUgaWRcbiAgICAkc2NvcGUucXVhbnRpdGllcyA9IFsxLDIsMyw0LDUsNiw3LDgsOV07XG5cbiAgICAkc2NvcGUuaW5pdGlhbGl6ZUNhcnQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgQ2FydEZhY3RvcnkuZ2V0Q3VycmVudFVzZXIoKS50aGVuKGZ1bmN0aW9uKGN1cnJlbnRPcmRlcikge1xuXG4gICAgICAgICAgICBpZiAoY3VycmVudE9yZGVyID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdub3RoaW5nIGluIGNhcnQnKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmRlZmluZUNhcnRTY29wZShjdXJyZW50T3JkZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KS5jYXRjaChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgIHJldHVybiBlcnI7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgICRzY29wZS5kZWxldGVQcm9kdWN0ID0gZnVuY3Rpb24ocHJvZHVjdCkge1xuICAgICAgLy9ERUxFVEUgL2FwaS91c2Vycy86dXNlcmlkL29yZGVycy86YW5vcmRlcmlkL3Byb2R1Y3RzLzphcHJvZHVjdElEXG4gICAgICAgIENhcnRGYWN0b3J5LmRlbGV0ZVByb2R1Y3RJbkNhcnQoJHNjb3BlLmN1cnJlbnRPcmRlci51c2VyX2lkLCAkc2NvcGUuY3VycmVudE9yZGVyLl9pZCwgcHJvZHVjdC5pZC5faWQpLnRoZW4oZnVuY3Rpb24obmV3Q3VycmVudE9yZGVyKSB7XG4gICAgICAgICAgICAkc2NvcGUuZGVmaW5lQ2FydFNjb3BlKG5ld0N1cnJlbnRPcmRlcik7XG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICAgcmV0dXJuIGVycjtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgJHNjb3BlLnNhdmVRdWFudGl0eSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBDYXJ0RmFjdG9yeS5zYXZlT3JkZXIoJHNjb3BlLmN1cnJlbnRPcmRlci51c2VyX2lkLCAkc2NvcGUuY3VycmVudE9yZGVyLl9pZCwgJHNjb3BlLmN1cnJlbnRPcmRlcikudGhlbihmdW5jdGlvbihuZXdDdXJyZW50T3JkZXIpIHtcbiAgICAgICAgICAgICRzY29wZS5kZWZpbmVDYXJ0U2NvcGUobmV3Q3VycmVudE9yZGVyKTtcbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgICAgICByZXR1cm4gZXJyO1xuICAgICAgICB9KTsgIFxuICAgIH1cblxuICAgICRzY29wZS5kZWZpbmVDYXJ0U2NvcGUgPSBmdW5jdGlvbiAoY3VycmVudE9yZGVyKSB7XG4gICAgICAgIGlmIChjdXJyZW50T3JkZXIpIHtcbiAgICAgICAgICAgICRzY29wZS5vcmRlckRhdGEgPSBjdXJyZW50T3JkZXIucHJvZHVjdHM7XG4gICAgICAgICAgICAkc2NvcGUuY3VycmVudE9yZGVyID0gY3VycmVudE9yZGVyO1xuICAgICAgICAgICAgJHNjb3BlLnByaWNlU3VtID0gQ2FydEZhY3RvcnkucHJpY2VTdW0oY3VycmVudE9yZGVyKTtcbiAgICAgICAgICAgICRzY29wZS5pdGVtQ291bnQgPSBDYXJ0RmFjdG9yeS5pdGVtQ291bnQoY3VycmVudE9yZGVyKTtcbiAgICAgICAgICAgICRzY29wZS5zYWxlc1RheCA9ICRzY29wZS5wcmljZVN1bSA+IDAgPyAyOC41MCA6IDA7XG4gICAgICAgICAgICAkc2NvcGUuc2hpcHBpbmdIYW5kbGluZyA9ICRzY29wZS5wcmljZVN1bSA+IDAgPyAyMC4wMCA6IDA7XG4gICAgICAgICAgICAkc2NvcGUudG90YWxPcmRlciA9ICRzY29wZS5wcmljZVN1bSArICRzY29wZS5zYWxlc1RheCArICRzY29wZS5zaGlwcGluZ0hhbmRsaW5nO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgJHNjb3BlLmluaXRpYWxpemVDYXJ0KCk7XG59KTsiLCIoZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLy8gSG9wZSB5b3UgZGlkbid0IGZvcmdldCBBbmd1bGFyISBEdWgtZG95LlxuICAgIGlmICghd2luZG93LmFuZ3VsYXIpIHRocm93IG5ldyBFcnJvcignSSBjYW5cXCd0IGZpbmQgQW5ndWxhciEnKTtcblxuICAgIHZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnZnNhUHJlQnVpbHQnLCBbXSk7XG5cbiAgICBhcHAuZmFjdG9yeSgnU29ja2V0JywgZnVuY3Rpb24gKCRsb2NhdGlvbikge1xuXG4gICAgICAgIGlmICghd2luZG93LmlvKSB0aHJvdyBuZXcgRXJyb3IoJ3NvY2tldC5pbyBub3QgZm91bmQhJyk7XG5cbiAgICAgICAgdmFyIHNvY2tldDtcblxuICAgICAgICBpZiAoJGxvY2F0aW9uLiQkcG9ydCkge1xuICAgICAgICAgICAgc29ja2V0ID0gaW8oJ2h0dHA6Ly9sb2NhbGhvc3Q6MTMzNycpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc29ja2V0ID0gaW8oJy8nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzb2NrZXQ7XG5cbiAgICB9KTtcblxuICAgIC8vIEFVVEhfRVZFTlRTIGlzIHVzZWQgdGhyb3VnaG91dCBvdXIgYXBwIHRvXG4gICAgLy8gYnJvYWRjYXN0IGFuZCBsaXN0ZW4gZnJvbSBhbmQgdG8gdGhlICRyb290U2NvcGVcbiAgICAvLyBmb3IgaW1wb3J0YW50IGV2ZW50cyBhYm91dCBhdXRoZW50aWNhdGlvbiBmbG93LlxuICAgIGFwcC5jb25zdGFudCgnQVVUSF9FVkVOVFMnLCB7XG4gICAgICAgIGxvZ2luU3VjY2VzczogJ2F1dGgtbG9naW4tc3VjY2VzcycsXG4gICAgICAgIGxvZ2luRmFpbGVkOiAnYXV0aC1sb2dpbi1mYWlsZWQnLFxuICAgICAgICBsb2dvdXRTdWNjZXNzOiAnYXV0aC1sb2dvdXQtc3VjY2VzcycsXG4gICAgICAgIHNlc3Npb25UaW1lb3V0OiAnYXV0aC1zZXNzaW9uLXRpbWVvdXQnLFxuICAgICAgICBub3RBdXRoZW50aWNhdGVkOiAnYXV0aC1ub3QtYXV0aGVudGljYXRlZCcsXG4gICAgICAgIG5vdEF1dGhvcml6ZWQ6ICdhdXRoLW5vdC1hdXRob3JpemVkJ1xuICAgIH0pO1xuXG4gICAgYXBwLmZhY3RvcnkoJ0F1dGhJbnRlcmNlcHRvcicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCAkcSwgQVVUSF9FVkVOVFMpIHtcbiAgICAgICAgdmFyIHN0YXR1c0RpY3QgPSB7XG4gICAgICAgICAgICA0MDE6IEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQsXG4gICAgICAgICAgICA0MDM6IEFVVEhfRVZFTlRTLm5vdEF1dGhvcml6ZWQsXG4gICAgICAgICAgICA0MTk6IEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LFxuICAgICAgICAgICAgNDQwOiBBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dFxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzcG9uc2VFcnJvcjogZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KHN0YXR1c0RpY3RbcmVzcG9uc2Uuc3RhdHVzXSwgcmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QocmVzcG9uc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0pO1xuXG4gICAgYXBwLmNvbmZpZyhmdW5jdGlvbiAoJGh0dHBQcm92aWRlcikge1xuICAgICAgICAkaHR0cFByb3ZpZGVyLmludGVyY2VwdG9ycy5wdXNoKFtcbiAgICAgICAgICAgICckaW5qZWN0b3InLFxuICAgICAgICAgICAgZnVuY3Rpb24gKCRpbmplY3Rvcikge1xuICAgICAgICAgICAgICAgIHJldHVybiAkaW5qZWN0b3IuZ2V0KCdBdXRoSW50ZXJjZXB0b3InKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgXSk7XG4gICAgfSk7XG5cbiAgICBhcHAuc2VydmljZSgnQXV0aFNlcnZpY2UnLCBmdW5jdGlvbiAoJGh0dHAsIFNlc3Npb24sICRyb290U2NvcGUsIEFVVEhfRVZFTlRTLCAkcSkge1xuXG4gICAgICAgIC8vIFVzZXMgdGhlIHNlc3Npb24gZmFjdG9yeSB0byBzZWUgaWYgYW5cbiAgICAgICAgLy8gYXV0aGVudGljYXRlZCB1c2VyIGlzIGN1cnJlbnRseSByZWdpc3RlcmVkLlxuICAgICAgICB0aGlzLmlzQXV0aGVudGljYXRlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAhIVNlc3Npb24udXNlcjtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldExvZ2dlZEluVXNlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vIElmIGFuIGF1dGhlbnRpY2F0ZWQgc2Vzc2lvbiBleGlzdHMsIHdlXG4gICAgICAgICAgICAvLyByZXR1cm4gdGhlIHVzZXIgYXR0YWNoZWQgdG8gdGhhdCBzZXNzaW9uXG4gICAgICAgICAgICAvLyB3aXRoIGEgcHJvbWlzZS4gVGhpcyBlbnN1cmVzIHRoYXQgd2UgY2FuXG4gICAgICAgICAgICAvLyBhbHdheXMgaW50ZXJmYWNlIHdpdGggdGhpcyBtZXRob2QgYXN5bmNocm9ub3VzbHkuXG4gICAgICAgICAgICBpZiAodGhpcy5pc0F1dGhlbnRpY2F0ZWQoKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcS53aGVuKFNlc3Npb24udXNlcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIE1ha2UgcmVxdWVzdCBHRVQgL3Nlc3Npb24uXG4gICAgICAgICAgICAvLyBJZiBpdCByZXR1cm5zIGEgdXNlciwgY2FsbCBvblN1Y2Nlc3NmdWxMb2dpbiB3aXRoIHRoZSByZXNwb25zZS5cbiAgICAgICAgICAgIC8vIElmIGl0IHJldHVybnMgYSA0MDEgcmVzcG9uc2UsIHdlIGNhdGNoIGl0IGFuZCBpbnN0ZWFkIHJlc29sdmUgdG8gbnVsbC5cbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9zZXNzaW9uJykudGhlbihvblN1Y2Nlc3NmdWxMb2dpbikuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfTtcblxuXHRcdHRoaXMuaXNBZG1pbiA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYgKHRoaXMuaXNBdXRoZW50aWNhdGVkKCkpXG5cdFx0XHRcdHJldHVybiAhIVNlc3Npb24udXNlci5hZG1pbjtcblx0XHRcdGVsc2Vcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdHRoaXMubG9naW4gPSBmdW5jdGlvbiAoY3JlZGVudGlhbHMpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvbG9naW4nLCBjcmVkZW50aWFscylcbiAgICAgICAgICAgICAgICAudGhlbihvblN1Y2Nlc3NmdWxMb2dpbilcbiAgICAgICAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QoeyBtZXNzYWdlOiAnSW52YWxpZCBsb2dpbiBjcmVkZW50aWFscy4nIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL2xvZ291dCcpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIFNlc3Npb24uZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChBVVRIX0VWRU5UUy5sb2dvdXRTdWNjZXNzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIGZ1bmN0aW9uIG9uU3VjY2Vzc2Z1bExvZ2luKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICBTZXNzaW9uLmNyZWF0ZShkYXRhLmlkLCBkYXRhLnVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ2luU3VjY2Vzcyk7XG4gICAgICAgICAgICByZXR1cm4gZGF0YS51c2VyO1xuICAgICAgICB9O1xuXG4gICAgfSk7XG5cbiAgICBhcHAuc2VydmljZSgnU2Vzc2lvbicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBVVRIX0VWRU5UUykge1xuXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5ub3RBdXRoZW50aWNhdGVkLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLmRlc3Ryb3koKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYuZGVzdHJveSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmlkID0gbnVsbDtcbiAgICAgICAgdGhpcy51c2VyID0gbnVsbDtcblxuICAgICAgICB0aGlzLmNyZWF0ZSA9IGZ1bmN0aW9uIChzZXNzaW9uSWQsIHVzZXIpIHtcbiAgICAgICAgICAgIHRoaXMuaWQgPSBzZXNzaW9uSWQ7XG4gICAgICAgICAgICB0aGlzLnVzZXIgPSB1c2VyO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy51c2VyID0gbnVsbDtcbiAgICAgICAgfTtcblxuICAgIH0pO1xuXG59KSgpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlclxuICAgIFx0LnN0YXRlKCdob21lJywge1xuXHQgICAgICAgIHVybDogJy8nLFxuXHQgICAgICAgIHRlbXBsYXRlVXJsOiAnanMvaG9tZS9ob21lLmh0bWwnLFxuXHQgICAgfSk7XG59KTtcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnbG9naW4nLCB7XG4gICAgICAgIHVybDogJy9sb2dpbicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvbG9naW4vbG9naW4uaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdMb2dpbkN0cmwnXG4gICAgfSk7XG5cbn0pO1xuXG5hcHAuY29udHJvbGxlcignTG9naW5DdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgQXV0aFNlcnZpY2UsICRzdGF0ZSkge1xuXG4gICAgJHNjb3BlLmxvZ2luID0ge307XG4gICAgJHNjb3BlLmVycm9yID0gbnVsbDtcblxuICAgICRzY29wZS5zZW5kTG9naW4gPSBmdW5jdGlvbiAobG9naW5JbmZvKSB7XG5cbiAgICAgICAgJHNjb3BlLmVycm9yID0gbnVsbDtcblxuICAgICAgICBBdXRoU2VydmljZS5sb2dpbihsb2dpbkluZm8pLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHN0YXRlLmdvKCdob21lJyk7XG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5lcnJvciA9ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLic7XG4gICAgICAgIH0pO1xuXG4gICAgfTtcblxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuICAgICRzdGF0ZVByb3ZpZGVyXG4gICAgICAgIC5zdGF0ZSgnbWVtYmVyc09ubHknLCB7XG4gICAgICAgICAgICB1cmw6ICcvbWVtYmVycy1hcmVhJyxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnanMvbWVtYmVycy1vbmx5L21lbWJlcnMtb25seS5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdNZW1iZXJDb250cm9sbGVyJyxcbiAgICAgICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgICAgICAgICBvcmRlcjogZnVuY3Rpb24oQ2FydEZhY3RvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIENhcnRGYWN0b3J5LmdldEN1cnJlbnRVc2VyKClcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHVzZXI6IGZ1bmN0aW9uKEF1dGhTZXJ2aWNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gVGhlIGZvbGxvd2luZyBkYXRhLmF1dGhlbnRpY2F0ZSBpcyByZWFkIGJ5IGFuIGV2ZW50IGxpc3RlbmVyIHRoYXQgY29udHJvbHMgYWNjZXNzIHRvIHRoaXMgc3RhdGUuIFJlZmVyIHRvIGFwcC5qcy5cbiAgICAgICAgICAgIGRhdGE6IHsgICAgICAgICAgXG4gICAgICAgICAgICAgICAgYXV0aGVudGljYXRlOiB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5zdGF0ZSgnbWVtYmVyc09ubHkuZWRpdCcsIHtcbiAgICAgICAgICAgIHVybDogJy86dXNlcklEJyxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnanMvbWVtYmVycy1vbmx5L21lbWJlcnMtb25seS1lZGl0Lmh0bWwnXG4gICAgICAgIH0pXG4gICAgICAgIC5zdGF0ZSgnbWVtYmVyc09ubHkucmV2aWV3Jywge1xuICAgICAgICAgICAgdXJsOiAnLzpwcm9kdWN0SUQnLFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9tZW1iZXJzLW9ubHkvbWVtYmVycy1vbmx5LXJldmlldy5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdNZW1iZXJDb250cm9sbGVyJ1xuICAgICAgICB9KSBcbn0pO1xuXG5hcHAuY29udHJvbGxlcignTWVtYmVyQ29udHJvbGxlcicsIGZ1bmN0aW9uKCRzY29wZSwgJGh0dHAsIG9yZGVyLCB1c2VyLCAkc3RhdGVQYXJhbXMpIHtcbiAgICAgXG4gICRzY29wZS5vcmRlciA9IG9yZGVyO1xuICAkc2NvcGUudXNlciA9IHVzZXI7XG5cbiAgJHNjb3BlLnNhdmVVc2VyID0gZnVuY3Rpb24oKSB7XG4gICAgICAkaHR0cC5wdXQoJy9hcGkvdXNlcnMnLCAkc2NvcGUudXNlcilcbiAgICAgICAgICAudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfSlcbiAgfVxuXG4gIGlmICgkc3RhdGVQYXJhbXMucHJvZHVjdElEKSB7IFxuICAgICRzY29wZS5zdWJtaXRSZXZpZXcgPSBmdW5jdGlvbiAocmV2aWV3KSB7XG4gICAgICAgIHJldmlldy5wcm9kdWN0X2lkID0gJHN0YXRlUGFyYW1zLnByb2R1Y3RJRFxuICAgICAgICByZXZpZXcudXNlcl9pZCA9ICRzY29wZS51c2VyLl9pZFxuXG4gICAgICAgICRodHRwLnBvc3QoJy9hcGkvcHJvZHVjdHMvJyArICRzdGF0ZVBhcmFtcy5wcm9kdWN0SUQgKyAnL3Jldmlld3MnLCByZXZpZXcpXG4gICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdzdWNjZXNzZnVsbHkgc2F2ZWQgcmV2aWV3JywgcmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gIH07XG4gICAgXG59KTtcblxuXG5cbmFwcC5maWx0ZXIoJ29yZGVyU3RhdHVzJywgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIGlmIChpbnB1dCA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIHJldHVybiBcIkluIFByb2dyZXNzXCJcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBcIkNvbXBsZXRlZFwiXG4gICAgICAgIH1cbiAgICB9XG59KVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXHQkc3RhdGVQcm92aWRlclxuXHRcdC5zdGF0ZSgnb3JkZXJNZ3QnLCB7XG5cdFx0XHR1cmw6ICcvb3JkZXJNYW5hZ2VtZW50Jyxcblx0XHRcdHRlbXBsYXRlVXJsOiAnanMvb3JkZXItbWFuYWdlbWVudC9vcmRlci1tYW5hZ2VtZW50Lmh0bWwnLFxuXHRcdFx0Y29udHJvbGxlcjogJ09yZGVyTWFuYWdlbWVudENvbnRyb2xsZXInLFxuXHRcdFx0cmVzb2x2ZToge1xuXHRcdFx0XHRvcmRlcnM6IGZ1bmN0aW9uKE9yZGVycykge1xuXHRcdFx0XHRcdHJldHVybiBPcmRlcnMuZ2V0QWxsT3JkZXJzKClcblx0XHRcdFx0fSxcblx0XHRcdFx0ZGVsZXRlT3JkZXI6IGZ1bmN0aW9uIChPcmRlcnMpIHtcblx0XHRcdFx0XHRyZXR1cm4gT3JkZXJzLmRlbGV0ZU9yZGVyO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSlcblx0XHQuc3RhdGUoJ29yZGVyTWd0LmVkaXQnLCB7XG5cdFx0XHR1cmw6ICcvOm9yZGVySWQnLFxuXHRcdFx0dGVtcGxhdGVVcmw6ICdqcy9vcmRlci1tYW5hZ2VtZW50L29yZGVyLW1hbmFnZW1lbnQtZWRpdC5odG1sJyxcblx0XHRcdGNvbnRyb2xsZXI6ICdPcmRlck1hbmFnZW1lbnRDb250cm9sbGVyJ1xuXHRcdH0pXG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ09yZGVyTWFuYWdlbWVudENvbnRyb2xsZXInLCBmdW5jdGlvbigkc2NvcGUsIEF1dGhTZXJ2aWNlLCAkc3RhdGVQYXJhbXMsIG9yZGVycywgZGVsZXRlT3JkZXIsIE9yZGVycykge1xuXHRcdCRzY29wZS5vcmRlcnMgPSBvcmRlcnM7XG5cblx0XHRpZiAoJHN0YXRlUGFyYW1zLm9yZGVySWQpIHtcblx0XHRcdE9yZGVycy5nZXRPcmRlcigkc3RhdGVQYXJhbXMub3JkZXJJZClcblx0XHRcdFx0LnRoZW4oZnVuY3Rpb24gKG9yZGVyKSB7XG5cdFx0XHRcdFx0JHNjb3BlLm9yZGVySXRlbSA9IG9yZGVyO1xuXHRcdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLmRlbGV0ZU9yZGVyID0gZnVuY3Rpb24ob3JkZXJJRCkge1xuXG5cdFx0XHQvLyBEZWxldGUgdGhlIG9yZGVyIGZyb20gdGhlIGRhdGFiYXNlXG5cdFx0XHRkZWxldGVPcmRlcihvcmRlcklEKVxuXHRcdFx0XG5cdFx0XHQkc2NvcGUub3JkZXJzLmZvckVhY2goZnVuY3Rpb24gKG9yZGVyLCBpZHgpIHtcblx0XHRcdFx0aWYgKG9yZGVyLl9pZCA9PT0gb3JkZXJJRCkge1xuXHRcdFx0XHRcdHJldHVybiAkc2NvcGUub3JkZXJzLnNwbGljZShpZHgsIDEpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXHRcdH07XG5cblx0XHQkc2NvcGUuc2F2ZU9yZGVyID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRPcmRlcnMuc2F2ZU9yZGVyKCRzY29wZS5vcmRlckl0ZW0pO1xuXHRcdH07XG59KTtcbiIsIid1c2Ugc3RyaWN0JztcbmFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXJcblx0ICAgIC5zdGF0ZSgncHJvZHVjdE1ndCcsIHtcblx0ICAgICAgICB1cmw6ICcvcHJvZHVjdE1hbmFnZW1lbnQvJyxcblx0ICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL3Byb2R1Y3QtbWFuYWdlbWVudC9wcm9kdWN0LW1hbmFnZW1lbnQuaHRtbCcsXG5cdCAgICAgICAgY29udHJvbGxlcjogJ1Byb2R1Y3RNYW5hZ2VtZW50Q29udHJvbGxlcidcblx0ICAgIH0pICBcblx0ICAgIC5zdGF0ZSgncHJvZHVjdE1ndC5lZGl0Jywge1xuXHQgICAgXHR1cmw6ICcvOnByb2R1Y3RJRCcsXG5cdCAgICBcdHRlbXBsYXRlVXJsOiAnanMvcHJvZHVjdC1tYW5hZ2VtZW50L3Byb2R1Y3QtbWFuYWdlbWVudC1lZGl0Lmh0bWwnLFxuXHQgICAgXHRjb250cm9sbGVyOiAnUHJvZHVjdE1hbmFnZW1lbnRDb250cm9sbGVyJ1xuXHQgICAgfSlcbn0pO1xuXG5hcHAuY29udHJvbGxlcignUHJvZHVjdE1hbmFnZW1lbnRDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgJHN0YXRlUGFyYW1zLCAkaHR0cCwgUHJvZHVjdEZhY3RvcnkpIHsgXG5cblx0UHJvZHVjdEZhY3RvcnkucHJvZHVjdHMoKS50aGVuKGZ1bmN0aW9uKHByb2R1Y3QpIHtcblx0XHRcdCRzY29wZS5wcm9kdWN0cyA9IHByb2R1Y3Q7XG5cdH0pXG5cdFxuXG5cdGlmICgkc3RhdGVQYXJhbXMucHJvZHVjdElEKSB7XG5cdFx0UHJvZHVjdEZhY3RvcnkucHJvZHVjdEl0ZW0oJHN0YXRlUGFyYW1zLnByb2R1Y3RJRCkudGhlbihmdW5jdGlvbihpdGVtKSB7XG5cdFx0XHQkc2NvcGUucHJvZHVjdEl0ZW0gPSBpdGVtO1xuXHRcdH0pO1x0XG5cdH1cblxuXHQkc2NvcGUuc2F2ZVByb2R1Y3QgPSBmdW5jdGlvbigpIHtcblx0XHRQcm9kdWN0RmFjdG9yeS5zYXZlUHJvZHVjdCgkc2NvcGUucHJvZHVjdEl0ZW0pXG5cdH07XG5cblx0JHNjb3BlLnJlbW92ZVByb2R1Y3QgPSBmdW5jdGlvbihwcm9kdWN0KSB7XG5cdFx0JHNjb3BlLnByb2R1Y3RzLmZvckVhY2goIGZ1bmN0aW9uKHNjb3BlUHJvZHVjdCkge1xuXHRcdFx0aWYgKHByb2R1Y3QuX2lkID09PSBzY29wZVByb2R1Y3QuX2lkICkge1xuXHRcdFx0XHR2YXIgaW5kZXggPSAkc2NvcGUucHJvZHVjdHMuaW5kZXhPZihzY29wZVByb2R1Y3QpO1xuXHRcdFx0XHRyZXR1cm4gJHNjb3BlLnByb2R1Y3RzLnNwbGljZShpbmRleCwgMSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0UHJvZHVjdEZhY3RvcnkucmVtb3ZlUHJvZHVjdChwcm9kdWN0Ll9pZClcblx0fVxuXG59KVxuIiwiYXBwLmZhY3RvcnkoJ1Byb2R1Y3RGYWN0b3J5JywgZnVuY3Rpb24gKCRodHRwKSB7XG5cblx0cmV0dXJuIHtcblxuXHRcdHByb2R1Y3RzOiBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiAkaHR0cC5nZXQoJy9hcGkvcHJvZHVjdHMnKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICBcdFx0XHRcdHJldHVybiByZXNwb25zZS5kYXRhO1xuICAgICAgICBcdFx0fSk7XHRcblx0XHR9LFxuXG5cdFx0cHJvZHVjdENhdGVnb3J5OiBmdW5jdGlvbihjYXRlZ29yeSkge1xuXHRcdFx0cmV0dXJuICRodHRwLmdldCgnL2FwaS9jYXRlZ29yaWVzLycgKyBjYXRlZ29yeSkudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcblx0XHRcdFx0cmV0dXJuIHJlc3BvbnNlLmRhdGE7XG5cdFx0XHR9KVxuXHRcdH0sXG5cblx0XHRwcm9kdWN0UmV2aWV3czogZnVuY3Rpb24oaWQpIHtcblx0XHRcdHJldHVybiAkaHR0cC5nZXQoJy9hcGkvcHJvZHVjdHMvJyArIGlkICsgJy9yZXZpZXdzJykudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdHJldHVybiByZXNwb25zZS5kYXRhXG5cdFx0XHRcdH0pO1xuXHRcdH0sXG5cblx0XHRwcm9kdWN0SXRlbTogZnVuY3Rpb24oaWQpIHtcblx0XHRcdHJldHVybiAkaHR0cC5nZXQoJy9hcGkvcHJvZHVjdHMvJyArIGlkKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHJlc3BvbnNlLmRhdGE7XG5cdFx0XHRcdFx0fSk7XG5cdFx0fSxcblxuXHRcdGNyZWF0ZU9yZGVyOiBmdW5jdGlvbihpZCkge1xuXHRcdFx0cmV0dXJuICRodHRwLnBvc3QoJy9hcGkvcHJvZHVjdHMvJyArIGlkKTtcblx0XHR9LFxuXG5cdFx0c2F2ZVByb2R1Y3Q6IGZ1bmN0aW9uKGl0ZW0pIHtcblx0XHRcdHJldHVybiAkaHR0cC5wdXQoJy9hcGkvcHJvZHVjdHMnLCBpdGVtKVxuXHRcdH0sXG5cblx0XHRyZW1vdmVQcm9kdWN0OiBmdW5jdGlvbihpZCkge1xuXHRcdFx0cmV0dXJuICRodHRwLmRlbGV0ZSgnL2FwaS9wcm9kdWN0cy8nICsgaWQpXG5cdFx0fSxcblxuXHRcdGdldEJyYW5kczogZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL2NhdGVnb3JpZXMvJykudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcblx0XHRcdFx0cmV0dXJuIHJlc3BvbnNlLmRhdGE7XG5cdFx0XHR9KVxuXHRcdH0sXG5cblx0XHRzdWJtaXRSZXZpZXc6IGZ1bmN0aW9uKHByb2R1Y3RJRCwgcmV2aWV3KSB7XG5cdFx0XHRyZXR1cm4gJGh0dHAucG9zdCgnL2FwaS9wcm9kdWN0cy8nICsgcHJvZHVjdElEICsgJy9yZXZpZXdzJywgcmV2aWV3KS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuXHRcdFx0XHRyZXR1cm4gcmVzcG9uc2UuZGF0YTtcblx0XHRcdH0pO1xuXHRcdH1cblxuXHR9XG5cblxufSkiLCIndXNlIHN0cmljdCc7XG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyXG5cdCAgICAuc3RhdGUoJ3Byb2R1Y3RzJywge1xuXHQgICAgICAgIHVybDogJy8nLFxuXHQgICAgICAgIHRlbXBsYXRlVXJsOiAnanMvcHJvZHVjdHMvcHJvZHVjdHMuaHRtbCcsXG5cdCAgICAgICAgY29udHJvbGxlcjogJ1Byb2R1Y3RzQ29udHJvbGxlcidcblx0ICAgIH0pXG5cdCAgICAuc3RhdGUoJ3Byb2R1Y3RzLml0ZW0nLCB7XG5cdCAgICBcdHVybDogJy86cHJvZHVjdElEJyxcblx0ICAgIFx0dGVtcGxhdGVVcmw6ICdqcy9wcm9kdWN0cy9wcm9kdWN0SXRlbS5odG1sJyxcblx0ICAgIFx0Y29udHJvbGxlcjogJ1Byb2R1Y3RzQ29udHJvbGxlcidcblx0ICAgIH0pXG5cdFx0LnN0YXRlKCdwcm9kdWN0cy5jYXRlZ29yaWVzJywge1xuXHQgICAgXHR1cmw6ICcvOnByb2R1Y3RDYXRlZ29yeScsXG5cdCAgICBcdHRlbXBsYXRlVXJsOiAnanMvcHJvZHVjdHMvcHJvZHVjdENhdGVnb3J5Lmh0bWwnLFxuXHQgICAgXHRjb250cm9sbGVyOiAnUHJvZHVjdHNDb250cm9sbGVyJ1xuXHQgICAgfSlcblx0ICAgICAgICBcbn0pO1xuXG5hcHAuY29udHJvbGxlcignUHJvZHVjdHNDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgJHN0YXRlUGFyYW1zLCBQcm9kdWN0RmFjdG9yeSkgeyBcblxuXHQkc2NvcGUuY3VycmVudENhdGVnb3J5O1xuXHQkc2NvcGUuZ2VuZGVycyA9IFsnV29tZW4nLCAnTWVuJ107XG5cdCRzY29wZS5zbGlkZXMgPSBbXTtcblxuXHRQcm9kdWN0RmFjdG9yeS5nZXRCcmFuZHMoKS50aGVuKGZ1bmN0aW9uKGJyYW5kcykge1xuXHRcdCRzY29wZS5icmFuZHMgPSBicmFuZHM7XG5cdH0pO1xuXG4gICBcdGlmICgkc3RhdGVQYXJhbXMucHJvZHVjdENhdGVnb3J5KSB7XG5cdFx0UHJvZHVjdEZhY3RvcnkucHJvZHVjdENhdGVnb3J5KCRzdGF0ZVBhcmFtcy5wcm9kdWN0Q2F0ZWdvcnkpLnRoZW4oZnVuY3Rpb24oY2F0ZWdvcnkpIHtcblx0XHRcdCRzY29wZS5wcm9kdWN0Q2F0ZWdvcnkgPSBjYXRlZ29yeTtcblx0XHRcdCRzY29wZS5jdXJyZW50Q2F0ZWdvcnkgPSAkc3RhdGVQYXJhbXMucHJvZHVjdENhdGVnb3J5O1xuXHRcdH0pXG5cdH1cblx0XG5cdGlmICgkc3RhdGVQYXJhbXMucHJvZHVjdElEKSB7XG5cdFx0UHJvZHVjdEZhY3RvcnkucHJvZHVjdFJldmlld3MoJHN0YXRlUGFyYW1zLnByb2R1Y3RJRCkudGhlbihmdW5jdGlvbihyZXZpZXdzKSB7XG5cdFx0XHQkc2NvcGUucHJvZHVjdFJldmlld3MgPSByZXZpZXdzO1xuXHRcdH0pO1xuXG5cdFx0UHJvZHVjdEZhY3RvcnkucHJvZHVjdEl0ZW0oJHN0YXRlUGFyYW1zLnByb2R1Y3RJRCkudGhlbihmdW5jdGlvbihpdGVtKSB7XG5cdFx0XHQkc2NvcGUucHJvZHVjdEl0ZW0gPSBpdGVtO1xuXG5cdFx0XHQkc2NvcGUuc2xpZGVzID0gW107XG5cdFx0XHRcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgJHNjb3BlLnByb2R1Y3RJdGVtLmltYWdlVVJMLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdCRzY29wZS5zbGlkZXMucHVzaCh7XG5cdFx0XHRcdCAgXHRpbWFnZTogJHNjb3BlLnByb2R1Y3RJdGVtLmltYWdlVVJMW2ldXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH0pO1x0XHRcblx0fTtcblxuXHQkc2NvcGUuY3JlYXRlT3JkZXIgPSBmdW5jdGlvbihpZCkge1xuXHRcdFByb2R1Y3RGYWN0b3J5LmNyZWF0ZU9yZGVyKGlkKTtcblx0fVxuXG5cdCRzY29wZS5vdXRPZlN0b2NrID0gZnVuY3Rpb24oc3RvY2spIHtcblx0XHRpZiAoc3RvY2sgPiAwKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0fVxuXG5cdCRzY29wZS5yZXZpZXdJdGVtID0ge1xuXHQgICAgICB1c2VyX2lkOiBudWxsLFxuXHQgICAgICBwcm9kdWN0X2lkOiAkc3RhdGVQYXJhbXMucHJvZHVjdElELFxuXHQgICAgICBzdGFyczogMCxcblx0ICAgICAgcmV2aWV3OiAnJ1xuXHQgIH07XG5cblx0JHNjb3BlLnNob3dSZXZpZXdGb3JtID0gZmFsc2U7XG5cblx0JHNjb3BlLiR3YXRjaCgnc2hvd1Jldmlld0Zvcm0nLCBmdW5jdGlvbigpe1xuXHQgICAgJHNjb3BlLmFkZFJldmlld0J1dHRvblRleHQgPSAkc2NvcGUuc2hvd1Jldmlld0Zvcm0gPyAnSGlkZSBGb3JtJyA6ICdBZGQgUmV2aWV3Jztcblx0fSlcblxuXHQkc2NvcGUuc3VibWl0UmV2aWV3ID0gZnVuY3Rpb24gKHJldmlldykge1xuXG5cdCAgXHRQcm9kdWN0RmFjdG9yeS5zdWJtaXRSZXZpZXcoJHN0YXRlUGFyYW1zLnByb2R1Y3RJRCwgcmV2aWV3KS50aGVuKGZ1bmN0aW9uKHJldmlldykge1xuXHQgIFx0XHRjb25zb2xlLmxvZygnUmV2aWV3IHN1Ym1pdHRlZCAtICcsIHJldmlldyk7XG5cdCAgXHR9KTtcblxuXHQgICAgJHNjb3BlLnJldmlld0l0ZW0gPSB7XG5cdCAgICAgICAgdXNlcl9pZDogbnVsbCxcblx0ICAgICAgICBwcm9kdWN0X2lkOiAkc3RhdGVQYXJhbXMucHJvZHVjdElELFxuXHQgICAgICAgIHN0YXJzOiAwLFxuXHQgICAgICAgIHJldmlldzogJydcblx0ICAgIH07XG5cblx0ICAgICRzY29wZS5zaG93UmV2aWV3Rm9ybSA9IGZhbHNlO1xuXHR9O1xufSk7XG5cblxuXG5cbiIsImFwcC5mYWN0b3J5KCdTZWFyY2hGYWN0b3J5JywgZnVuY3Rpb24gKCRodHRwKSB7XG5cbiAgICByZXR1cm4ge1xuXG4gICAgICAgIHNlYXJjaFByb2R1Y3RzOiBmdW5jdGlvbiAocGFyYW1zKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIHVybDogJy9hcGkvc2VhcmNoJyxcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgIHBhcmFtczogcGFyYW1zXG4gICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uKHJlcyl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5kYXRhO1xuICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgIHJldHVybiBlcnI7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBnZXRCcmFuZHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJ2FwaS9jYXRlZ29yaWVzJykudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzLmRhdGE7XG4gICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVycjtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuLy9UaGUgQ29uZmlnIGJlbG93IGRlZmluZXMgdGhlIC9zZWFyY2ggc3RhdGUsIHdoaWNoIHdpbGxcbi8vYWxsb3cgdGhlIHVzZXIgdG8gc2VhcmNoIGZvciBwcm9kdWN0cy5cblxuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpe1xuICAgICRzdGF0ZVByb3ZpZGVyXG4gICAgICAgIC5zdGF0ZSgnc2VhcmNoJywge1xuICAgICAgICAgICAgdXJsOiAnL3NlYXJjaD86cGFyYW0nLFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9zZWFyY2gvc2VhcmNoLmh0bWwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogJ1NlYXJjaENvbnRyb2xsZXInXG4gICAgICAgIH0pO1xufSk7XG5cblxuYXBwLmNvbnRyb2xsZXIoJ1NlYXJjaENvbnRyb2xsZXInLCBmdW5jdGlvbigkc2NvcGUsICRzdGF0ZVBhcmFtcywgU2VhcmNoRmFjdG9yeSkge1xuXHQkc2NvcGUuYnJhbmRzID0gW107XG4gICAgJHNjb3BlLnBhcmFtT2JqID0ge307XG4gICAgJHNjb3BlLnNlYXJjaFJlc3VsdHMgPSBbXTtcblxuICAgICRzY29wZS5taW5QcmljZVJhbmdlcyA9IFsgICBcbiAgICAgICAge3RleHQ6JyQwJywgdmFsdWU6ICcnfSxcbiAgICAgICAge3RleHQ6JyQ1MCcsIHZhbHVlOiA1MC4wMH0sXG4gICAgICAgIHt0ZXh0OickMTAwJywgdmFsdWU6IDEwMC4wMH0sXG4gICAgICAgIHt0ZXh0OickMTUwJywgdmFsdWU6IDE1MC4wMH1cbiAgICBdO1xuXG4gICAgJHNjb3BlLm1heFByaWNlUmFuZ2VzID0gW1xuICAgICAgICB7dGV4dDonJDUwJywgdmFsdWU6IDUwLjAwfSxcbiAgICAgICAge3RleHQ6JyQxMDAnLCB2YWx1ZTogMTAwLjAwfSxcbiAgICAgICAge3RleHQ6JyQxNTAnLCB2YWx1ZTogMTUwLjAwfSxcbiAgICAgICAge3RleHQ6JyQyMDAgYW5kIG92ZXInLCB2YWx1ZTogJyd9XG4gICAgXTtcblxuICAgIGZ1bmN0aW9uIHNldFBhcmFtT2JqKCkge1xuICAgICAgICAkc2NvcGUucGFyYW1PYmogPSB7IFxuICAgICAgICAgICAgdGl0bGU6ICcnLFxuICAgICAgICAgICAgYnJhbmRzOiBbXSxcbiAgICAgICAgICAgIGdlbmRlcjogJycsXG4gICAgICAgICAgICBwcmljZVJhbmdlOiB7bWluOiAnJywgbWF4OiAnJ30sXG4gICAgICAgICAgICBhdmdTdGFyczogJycgXG4gICAgICAgIH07XG4gICAgfTtcblxuICAgICRzY29wZS5nZXRQYW5lbERhdGEgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgU2VhcmNoRmFjdG9yeS5nZXRCcmFuZHMoKS50aGVuKGZ1bmN0aW9uKGJyYW5kcykge1xuICAgICAgICAgICAgJHNjb3BlLmJyYW5kcyA9IGJyYW5kcztcbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgICAgICByZXR1cm4gZXJyO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLmluaXRpYWxpemVTZWFyY2ggPSBmdW5jdGlvbigpIHtcbiAgICBcdFNlYXJjaEZhY3Rvcnkuc2VhcmNoUHJvZHVjdHMoJHNjb3BlLnBhcmFtT2JqKS50aGVuKGZ1bmN0aW9uKHByb2R1Y3RzKSB7XG4gICAgXHRcdCRzY29wZS5zZWFyY2hSZXN1bHRzID0gcHJvZHVjdHM7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhwcm9kdWN0cyk7XG4gICAgXHR9KS5jYXRjaChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgIHJldHVybiBlcnI7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAkc2NvcGUudG9nZ2xlU2VsZWN0aW9uID0gZnVuY3Rpb24gKGJyYW5kKSB7XG4gICAgICAgIHZhciBpZHggPSAkc2NvcGUucGFyYW1PYmouYnJhbmRzLmluZGV4T2YoYnJhbmQpO1xuXG4gICAgICAgIGlmIChpZHggPiAtMSkge1xuICAgICAgICAgICRzY29wZS5wYXJhbU9iai5icmFuZHMuc3BsaWNlKGlkeCwgMSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJHNjb3BlLnBhcmFtT2JqLmJyYW5kcy5wdXNoKGJyYW5kKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAkc2NvcGUucmVzZXRQYXJhbXMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgc2V0UGFyYW1PYmooKTtcbiAgICAgICAgJHNjb3BlLnNlYXJjaFJlc3VsdHMgPSB7fTtcbiAgICB9O1xuXG4gICAgc2V0UGFyYW1PYmooKTtcbiAgICAkc2NvcGUuZ2V0UGFuZWxEYXRhKCk7XG5cbiAgICBpZiAoJHN0YXRlUGFyYW1zLnBhcmFtKSB7XG4gICAgICAgICRzY29wZS5wYXJhbU9iai50aXRsZSA9ICRzdGF0ZVBhcmFtcy5wYXJhbTtcbiAgICAgICAgJHNjb3BlLmluaXRpYWxpemVTZWFyY2goKTtcbiAgICB9XG59KTsiLCJhcHAuZmFjdG9yeSgnU2lnblVwRmFjdG9yeScsIGZ1bmN0aW9uICgkaHR0cCkge1xuXG4gICAgcmV0dXJuIHtcblxuICAgICAgICBzaWdudXBOZXdVc2VyOiBmdW5jdGlvbiAoc2lnbnVwT2JqZWN0KSB7XG4gICAgICAgICAgICByZXR1cm4gICRodHRwLnBvc3QoJy9hcGkvdXNlcnMnLCBzaWdudXBPYmplY3QpXG4gICAgICAgICAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVycjtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgIH07XG5cbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKXtcbiAgICAkc3RhdGVQcm92aWRlclxuICAgICAgICAuc3RhdGUoJ3NpZ251cCcsIHtcbiAgICAgICAgICAgIHVybDogJy9zaWdudXAnLFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9zaWdudXAvc2lnbnVwLmh0bWwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogJ1NpZ25VcEN0cmwnXG4gICAgICAgIH0pO1xufSk7XG5cbmFwcC5jb250cm9sbGVyKCdTaWduVXBDdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgQXV0aFNlcnZpY2UsICRzdGF0ZSwgU2lnblVwRmFjdG9yeSkge1xuXG4gICAgJHNjb3BlLmVycm9yID0gbnVsbDtcbiAgICAkc2NvcGUuc2lnbnVwID0ge307XG5cbiAgICAkc2NvcGUuc2VuZFNpZ251cCA9IGZ1bmN0aW9uIChzaWdudXApIHtcbiAgICAgICAgJHNjb3BlLmVycm9yID0gbnVsbDtcblxuICAgICAgICBTaWduVXBGYWN0b3J5LnNpZ251cE5ld1VzZXIoc2lnbnVwKVxuXHQgICAgICAgIC50aGVuKGZ1bmN0aW9uKHVzZXIpIHtcblx0ICAgICAgICBcdCRzdGF0ZS5nbygnaG9tZScpO1xuXHQgICAgICAgIFx0cmV0dXJuIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpO1xuXHQgICAgICAgIH0pXG5cdCAgICAgICAgLmNhdGNoKGZ1bmN0aW9uKGVycikge1xuXHQgICAgICAgIFx0JHNjb3BlLmVycm9yID0gJ1NpZ24gdXAgZm9ybSBub3QgY29tcGxldGVkL2ZpbGxlZCBjb3JyZWN0bHkhJztcblx0ICAgICAgICBcdGNvbnNvbGUuZXJyb3IoZXJyKTtcblx0ICAgICAgICB9KVxuICAgIH07XG5cbn0pOyIsIid1c2Ugc3RyaWN0JztcbmFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXJcblx0ICAgIC5zdGF0ZSgndXNlck1ndCcsIHtcblx0ICAgICAgICB1cmw6ICcvdXNlck1hbmFnZW1lbnQnLFxuXHQgICAgICAgIHRlbXBsYXRlVXJsOiAnanMvdXNlci1tYW5hZ2VtZW50L3VzZXItbWFuYWdlbWVudC5odG1sJyxcblx0ICAgICAgICBjb250cm9sbGVyOiAnVXNlck1hbmFnZW1lbnRDb250cm9sbGVyJ1xuXHQgICAgfSkgIFxuXHQgICAgLnN0YXRlKCd1c2VyTWd0LmVkaXQnLCB7XG5cdCAgICBcdHVybDogJy86dXNlcklEJyxcblx0ICAgIFx0dGVtcGxhdGVVcmw6ICdqcy91c2VyLW1hbmFnZW1lbnQvdXNlci1tYW5hZ2VtZW50LWVkaXQuaHRtbCcsXG5cdCAgICBcdGNvbnRyb2xsZXI6ICdVc2VyTWFuYWdlbWVudENvbnRyb2xsZXInXG5cdCAgICB9KVxufSk7XG5cbmFwcC5jb250cm9sbGVyKCdVc2VyTWFuYWdlbWVudENvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCAkc3RhdGVQYXJhbXMsICRodHRwKSB7IFxuXG5cdCRodHRwLmdldCgnL2FwaS91c2VycycpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgJHNjb3BlLnVzZXJzID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgfSlcdFxuXG5cdGlmICghISRzdGF0ZVBhcmFtcy51c2VySUQpIHtcblx0XHQgJGh0dHAuZ2V0KCcvYXBpL3VzZXJzLycgKyAkc3RhdGVQYXJhbXMudXNlcklEKVxuXHRcdFx0LnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG5cdFx0XHRcdCRzY29wZS51c2VySXRlbSA9IHJlc3BvbnNlLmRhdGE7XG5cdFx0fSlcblx0fVxuXG5cdC8vIHRoaXMgZnVuY3Rpb24gaXMgdXNlZCB3aGVuIHNhdmluZyBlZGl0cyB0byBleGlzdGluZyB1c2VycyAtTkMgNS8yLzE1XG5cdCRzY29wZS5zYXZlVXNlciA9IGZ1bmN0aW9uKCkge1xuXHRcdCRodHRwLnB1dCgnL2FwaS91c2VycycsICRzY29wZS51c2VySXRlbSlcblx0XHRcdC50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhyZXNwb25zZS5kYXRhKTtcblx0XHRcdH0pXG5cdH1cblxuXHQvLyByZW1vdmVzIGEgdXNlciAtTkMgNS8yLzE1XG5cdCRzY29wZS5yZW1vdmVVc2VyID0gZnVuY3Rpb24odXNlcikge1xuXHRcdCRzY29wZS51c2Vycy5mb3JFYWNoKCBmdW5jdGlvbihzY29wZVVzZXIpIHtcblx0XHRcdGlmICh1c2VyLl9pZCA9PT0gc2NvcGVVc2VyLl9pZCApIHtcblx0XHRcdFx0dmFyIGluZGV4ID0gJHNjb3BlLnVzZXJzLmluZGV4T2Yoc2NvcGVVc2VyKTtcblx0XHRcdFx0cmV0dXJuICRzY29wZS51c2Vycy5zcGxpY2UoaW5kZXgsIDEpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdFxuXHRcdCRodHRwLmRlbGV0ZSgnL2FwaS91c2Vycy8nICsgdXNlci5faWQpXG5cdFx0XHQudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcblx0XHRcdFx0Y29uc29sZS5sb2cocmVzcG9uc2UuZGF0YSk7XG5cdFx0XHR9KVxuXHR9O1xuXG59KVxuIiwiJ3VzZSBzdHJpY3QnO1xuYXBwLmZhY3RvcnkoJ1JhbmRvbUdyZWV0aW5ncycsIGZ1bmN0aW9uICgpIHtcblxuICAgIHZhciBnZXRSYW5kb21Gcm9tQXJyYXkgPSBmdW5jdGlvbiAoYXJyKSB7XG4gICAgICAgIHJldHVybiBhcnJbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogYXJyLmxlbmd0aCldO1xuICAgIH07XG5cbiAgICB2YXIgZ3JlZXRpbmdzID0gW1xuICAgICAgICAnSGVsbG8sIHdvcmxkIScsXG4gICAgICAgICdBdCBsb25nIGxhc3QsIEkgbGl2ZSEnLFxuICAgICAgICAnSGVsbG8sIHNpbXBsZSBodW1hbi4nLFxuICAgICAgICAnV2hhdCBhIGJlYXV0aWZ1bCBkYXkhJyxcbiAgICAgICAgJ0lcXCdtIGxpa2UgYW55IG90aGVyIHByb2plY3QsIGV4Y2VwdCB0aGF0IEkgYW0geW91cnMuIDopJyxcbiAgICAgICAgJ1RoaXMgZW1wdHkgc3RyaW5nIGlzIGZvciBMaW5kc2F5IExldmluZS4nXG4gICAgXTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGdyZWV0aW5nczogZ3JlZXRpbmdzLFxuICAgICAgICBnZXRSYW5kb21HcmVldGluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGdldFJhbmRvbUZyb21BcnJheShncmVldGluZ3MpO1xuICAgICAgICB9XG4gICAgfTtcblxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuZmFjdG9yeSgnT3JkZXJzJywgZnVuY3Rpb24gKEF1dGhTZXJ2aWNlLCAkaHR0cCkge1xuXG5cdC8vIGdldCBhbGwgb3JkZXJzIGJ5IGFkbWluXG4gICAgdmFyIGdldEFsbE9yZGVycyA9IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbihkYXRhKSB7XG5cdFx0XHR2YXIgdXJsID0gJy9hcGkvdXNlcnMvJyArIGRhdGEuX2lkICsgJy9hbGxPcmRlcnMnO1xuXHQgICAgICAgIHJldHVybiAkaHR0cC5nZXQodXJsKVxuXHRcdH0pXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG5cdCAgICBcdHJldHVybiByZXNwb25zZS5kYXRhO1xuXHRcdH0pXG4gICAgfVxuXG5cdC8vIGRlbGV0ZSB1cmw6IC9hcGkvdXNlcnMvX3VzZXJJRF8vb3JkZXJzL19vcmRlcklkXy9kZWxldGVcblx0dmFyIGRlbGV0ZU9yZGVyID0gZnVuY3Rpb24ob3JkZXJJZCkge1xuXHRcdHJldHVybiBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKVxuXHRcdFx0LnRoZW4oZnVuY3Rpb24gKGRhdGEpIHtcblx0XHRcdFx0dmFyIHVybCA9ICcvYXBpL3VzZXJzLycgKyBkYXRhLl9pZCArICcvb3JkZXJzLycgKyBvcmRlcklkICsgJy9kZWxldGUnXG5cdFx0XHRcdHJldHVybiAkaHR0cC5kZWxldGUodXJsKVxuXHRcdFx0fSlcblx0XHRcdC50aGVuKGZ1bmN0aW9uIChyZXMpIHtcblx0XHRcdFx0cmV0dXJuIHJlcy5kYXRhXG5cdFx0XHR9KVxuXHRcdFx0LmNhdGNoIChmdW5jdGlvbiAoZXJyKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKGVycilcblx0XHRcdFx0cmV0dXJuIGVyclxuXHRcdFx0fSlcblx0fTtcblxuXHR2YXIgZ2V0T3JkZXIgPSBmdW5jdGlvbihvcmRlcklkKSB7XG5cdFx0cmV0dXJuIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpXG5cdFx0XHQudGhlbihmdW5jdGlvbiAoZGF0YSkge1xuXHRcdFx0XHR2YXIgdXJsID0gJy9hcGkvdXNlcnMvJyArIGRhdGEuX2lkICsgJy9vcmRlcnMvJyArIG9yZGVySWQ7XG5cdFx0XHRcdHJldHVybiAkaHR0cC5nZXQodXJsKVxuXHRcdFx0fSlcblx0XHRcdC50aGVuIChmdW5jdGlvbiAocmVzKSB7XG5cdFx0XHRcdHJldHVybiByZXMuZGF0YVxuXHRcdFx0fSlcblx0XHRcdC5jYXRjaCAoZnVuY3Rpb24gKGVycikge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhlcnIpXG5cdFx0XHRcdHJldHVybiBlcnJcblx0XHRcdH0pXG5cdH07XG5cblx0dmFyIHNhdmVPcmRlciA9IGZ1bmN0aW9uIChvcmRlcikge1xuXHRcdHJldHVybiBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKVxuXHRcdFx0LnRoZW4oZnVuY3Rpb24gKGRhdGEpIHtcblx0XHRcdFx0dmFyIHVybCA9ICcvYXBpL3VzZXJzLycgKyBkYXRhLl9pZCArICcvb3JkZXJzLycgKyBvcmRlci5faWQ7XG5cdFx0XHRcdGNvbnNvbGUubG9nKG9yZGVyKTtcblx0XHRcdFx0cmV0dXJuICRodHRwLnB1dCh1cmwsIG9yZGVyKTtcblx0XHRcdH0pXG5cdH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGdldEFsbE9yZGVyczogZ2V0QWxsT3JkZXJzLFxuXHRcdGRlbGV0ZU9yZGVyOiBkZWxldGVPcmRlcixcblx0XHRnZXRPcmRlcjogZ2V0T3JkZXIsXG5cdFx0c2F2ZU9yZGVyOiBzYXZlT3JkZXJcbiAgICB9XG59KVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuZmFjdG9yeSgnVXNlcnMnLCBmdW5jdGlvbiAoQXV0aFNlcnZpY2UsICRodHRwKSB7XG5cbiAgICB2YXIgZ2V0QWxsVXNlcnMgPSBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpLnRoZW4oZnVuY3Rpb24oZGF0YSkge1xuXHRcdFx0dmFyIHVybCA9ICcvYXBpL3VzZXJzLyc7XG5cdFx0XHRjb25zb2xlLmxvZyh1cmwpO1xuXHQgICAgICAgIHJldHVybiAkaHR0cC5nZXQodXJsKVxuXHRcdH0pXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG5cdCAgICBcdHJldHVybiByZXNwb25zZS5kYXRhO1xuXHRcdH0pXG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ2V0QWxsVXNlcnM6IGdldEFsbFVzZXJzXG4gICAgfTtcbn0pO1xuIiwiLy8gdW5hYmxlIHRvIGdldCB0aGlzIHdvcmsgYXQgdGhlIG1vbWVudCAtIE5DIDQvMjYvMjAxNVxuXG4ndXNlIHN0cmljdCc7XG5hcHAuZGlyZWN0aXZlKCdoaXBzaGFkZXNMb2dvJywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvaGlwc2hhZGVzLWxvZ28vaGlwc2hhZGVzLWxvZ28uaHRtbCdcbiAgICB9O1xufSk7IiwiJ3VzZSBzdHJpY3QnO1xuYXBwLmRpcmVjdGl2ZSgnbmF2YmFyJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIEF1dGhTZXJ2aWNlLCBBVVRIX0VWRU5UUywgJHN0YXRlKSB7XG5cbiAgICAvLyBNYWtlIHN1cmUgdG8gcnVuIGd1bHAgdGhyb3VnaG91dCBkZXYsIGFuZCBjaGFuZ2UgdGhlIHByb2R1Y3RzIHN0YXRlXG4gICAgLy8gV2hlbiBwcm9kdWN0cyBhcmUgYXZhaWxhYmxlLlxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuaHRtbCcsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xuICAgICAgICAgICAgc2NvcGUuaXRlbXMgPSBbXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ0hvbWUnLCBzdGF0ZTogJ3Byb2R1Y3RzJyB9LFxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdDYXJ0Jywgc3RhdGU6ICdjYXJ0J30sXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ1VzZXIgU2V0dGluZ3MnLCBzdGF0ZTogJ21lbWJlcnNPbmx5JywgYXV0aDogdHJ1ZX1cbiAgICAgICAgICAgIF07XG4gICAgICAgICAgICBzY29wZS5hZG1pbkl0ZW1zID0gW1xuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdQcm9kdWN0IE1hbmFnZW1lbnQnLCBzdGF0ZTogJ3Byb2R1Y3RNZ3QnLCBhZG1pbjogdHJ1ZX0sXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ09yZGVyIE1hbmFnZW1lbnQnLCBzdGF0ZTogJ29yZGVyTWd0JywgYWRtaW46IHRydWV9LFxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdVc2VyIE1hbmFnZW1lbnQnLCBzdGF0ZTogJ3VzZXJNZ3QnLCBhZG1pbjogdHJ1ZX1cbiAgICAgICAgICAgIF07XG5cbiAgICAgICAgICAgIHNjb3BlLnVzZXIgPSBudWxsO1xuICAgICAgICAgICAgc2NvcGUubmF2U2VhcmNoU3RyaW5nID0gbnVsbDtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgc2NvcGUuaXNMb2dnZWRJbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCk7XG4gICAgICAgICAgICB9O1xuXG5cdFx0XHRzY29wZS5pc0FkbWluID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHJldHVybiBBdXRoU2VydmljZS5pc0FkbWluKCk7XG5cdFx0XHR9O1xuXG4gICAgICAgICAgICBzY29wZS5sb2dvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgQXV0aFNlcnZpY2UubG9nb3V0KCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdob21lJyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzY29wZS5zZWFyY2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdzZWFyY2gnLCB7IHBhcmFtOiBzY29wZS5uYXZTZWFyY2hTdHJpbmcgfSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB2YXIgc2V0VXNlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLnVzZXIgPSB1c2VyO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIHJlbW92ZVVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgc2NvcGUudXNlciA9IG51bGw7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHNldFVzZXIoKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubG9naW5TdWNjZXNzLCBzZXRVc2VyKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLmxvZ291dFN1Y2Nlc3MsIHJlbW92ZVVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsIHJlbW92ZVVzZXIpO1xuXG4gICAgICAgIH1cblxuICAgIH07XG5cbn0pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9