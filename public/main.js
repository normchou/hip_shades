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
            scope.items = [{ label: 'Home', state: 'home' }, { label: 'Products', state: 'products' }, { label: 'Cart', state: 'cart' }, { label: 'User Settings', state: 'membersOnly', auth: true }];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNhcnQvQ2FydEZhY3RvcnkuanMiLCJjYXJ0L2NhcnQuanMiLCJmc2EvZnNhLXByZS1idWlsdC5qcyIsImhvbWUvaG9tZS5qcyIsImxvZ2luL2xvZ2luLmpzIiwibWVtYmVycy1vbmx5L21lbWJlcnMtb25seS5qcyIsIm9yZGVyLW1hbmFnZW1lbnQvb3JkZXItbWFuYWdlbWVudC5qcyIsInByb2R1Y3QtbWFuYWdlbWVudC9wcm9kdWN0LW1hbmFnZW1lbnQuanMiLCJwcm9kdWN0cy9Qcm9kdWN0RmFjdG9yeS5qcyIsInByb2R1Y3RzL3Byb2R1Y3RzLmpzIiwic2VhcmNoL1NlYXJjaEZhY3RvcnkuanMiLCJzZWFyY2gvc2VhcmNoLmpzIiwic2lnbnVwL1NpZ251cEZhY3RvcnkuanMiLCJzaWdudXAvc2lnbnVwLmpzIiwidXNlci1tYW5hZ2VtZW50L3VzZXItbWFuYWdlbWVudC5qcyIsImNvbW1vbi9mYWN0b3JpZXMvUmFuZG9tR3JlZXRpbmdzLmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9Tb2NrZXQuanMiLCJjb21tb24vZmFjdG9yaWVzL2dldE9yZGVycy5qcyIsImNvbW1vbi9mYWN0b3JpZXMvZ2V0VXNlckRhdGEuanMiLCJjb21tb24vZGlyZWN0aXZlcy9oaXBzaGFkZXMtbG9nby9oaXBzaGFkZXMtbG9nby5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBQSxDQUFBO0FBQ0EsSUFBQSxHQUFBLEdBQUEsT0FBQSxDQUFBLE1BQUEsQ0FBQSx1QkFBQSxFQUFBLENBQUEsV0FBQSxFQUFBLGFBQUEsRUFBQSxjQUFBLENBQUEsQ0FBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxrQkFBQSxFQUFBLGlCQUFBLEVBQUE7O0FBRUEscUJBQUEsQ0FBQSxTQUFBLENBQUEsSUFBQSxDQUFBLENBQUE7O0FBRUEsc0JBQUEsQ0FBQSxTQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7Q0FDQSxDQUFBLENBQUE7OztBQUlBLEdBQUEsQ0FBQSxHQUFBLENBQUEsVUFBQSxVQUFBLEVBQUEsV0FBQSxFQUFBLE1BQUEsRUFBQTs7O0FBR0EsUUFBQSw0QkFBQSxHQUFBLHNDQUFBLEtBQUEsRUFBQTtBQUNBLGVBQUEsS0FBQSxDQUFBLElBQUEsSUFBQSxLQUFBLENBQUEsSUFBQSxDQUFBLFlBQUEsQ0FBQTtLQUNBLENBQUE7Ozs7QUFJQSxjQUFBLENBQUEsR0FBQSxDQUFBLG1CQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUEsT0FBQSxFQUFBLFFBQUEsRUFBQTs7QUFFQSxZQUFBLENBQUEsNEJBQUEsQ0FBQSxPQUFBLENBQUEsRUFBQTs7O0FBR0EsbUJBQUE7U0FDQTs7QUFFQSxZQUFBLFdBQUEsQ0FBQSxlQUFBLEVBQUEsRUFBQTs7O0FBR0EsbUJBQUE7U0FDQTs7O0FBR0EsYUFBQSxDQUFBLGNBQUEsRUFBQSxDQUFBOztBQUVBLG1CQUFBLENBQUEsZUFBQSxFQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsSUFBQSxFQUFBOzs7O0FBSUEsZ0JBQUEsSUFBQSxFQUFBO0FBQ0Esc0JBQUEsQ0FBQSxFQUFBLENBQUEsT0FBQSxDQUFBLElBQUEsRUFBQSxRQUFBLENBQUEsQ0FBQTthQUNBLE1BQUE7QUFDQSxzQkFBQSxDQUFBLEVBQUEsQ0FBQSxPQUFBLENBQUEsQ0FBQTthQUNBO1NBQ0EsQ0FBQSxDQUFBO0tBRUEsQ0FBQSxDQUFBO0NBRUEsQ0FBQSxDQUFBO0FDbkRBLEdBQUEsQ0FBQSxPQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBOztBQUVBLFdBQUE7O0FBRUEsc0JBQUEsRUFBQSwwQkFBQTs7O0FBR0EsbUJBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSx5QkFBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0Esb0JBQUEsR0FBQSxDQUFBLElBQUEsRUFDQSxPQUFBLEdBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQSxDQUFBLENBQUE7YUFDQSxDQUFBLFNBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLHVCQUFBLENBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBO0FBQ0EsdUJBQUEsR0FBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7O0FBRUEsMkJBQUEsRUFBQSw2QkFBQSxNQUFBLEVBQUEsT0FBQSxFQUFBLFNBQUEsRUFBQTtBQUNBLG1CQUFBLEtBQUEsVUFBQSxDQUFBLGFBQUEsR0FBQSxNQUFBLEdBQUEsVUFBQSxHQUFBLE9BQUEsR0FBQSxZQUFBLEdBQUEsU0FBQSxDQUFBLENBQ0EsSUFBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsdUJBQUEsR0FBQSxDQUFBLElBQUEsQ0FBQTthQUNBLENBQUEsU0FBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsdUJBQUEsQ0FBQSxLQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7QUFDQSx1QkFBQSxHQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FFQTs7QUFFQSxnQkFBQSxFQUFBLGtCQUFBLFlBQUEsRUFBQTtBQUNBLGdCQUFBLEtBQUEsR0FBQSxDQUFBLENBQUE7O0FBRUEsd0JBQUEsQ0FBQSxRQUFBLENBQUEsT0FBQSxDQUFBLFVBQUEsSUFBQSxFQUFBO0FBQ0EscUJBQUEsSUFBQSxJQUFBLENBQUEsRUFBQSxDQUFBLEtBQUEsR0FBQSxJQUFBLENBQUEsUUFBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBOztBQUVBLG1CQUFBLEtBQUEsQ0FBQTtTQUNBOztBQUVBLGlCQUFBLEVBQUEsbUJBQUEsWUFBQSxFQUFBO0FBQ0EsZ0JBQUEsS0FBQSxHQUFBLENBQUEsQ0FBQTs7QUFFQSx3QkFBQSxDQUFBLFFBQUEsQ0FBQSxPQUFBLENBQUEsVUFBQSxJQUFBLEVBQUE7QUFDQSxxQkFBQSxJQUFBLElBQUEsQ0FBQSxRQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7O0FBRUEsbUJBQUEsS0FBQSxDQUFBO1NBQ0E7O0FBRUEsaUJBQUEsRUFBQSxtQkFBQSxNQUFBLEVBQUEsT0FBQSxFQUFBLFlBQUEsRUFBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxJQUFBLENBQUEsYUFBQSxHQUFBLE1BQUEsR0FBQSxVQUFBLEdBQUEsT0FBQSxFQUFBLFlBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLHVCQUFBLEdBQUEsQ0FBQSxJQUFBLENBQUE7YUFDQSxDQUFBLFNBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLHVCQUFBLENBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBO0FBQ0EsdUJBQUEsR0FBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7O0tBRUEsQ0FBQTtDQUVBLENBQUEsQ0FBQTtBQzFEQSxZQUFBLENBQUE7Ozs7O0FBS0EsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTtBQUNBLGtCQUFBLENBQ0EsS0FBQSxDQUFBLE1BQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxPQUFBO0FBQ0EsbUJBQUEsRUFBQSxtQkFBQTtBQUNBLGtCQUFBLEVBQUEsZ0JBQUE7S0FDQSxDQUFBLENBQUE7Q0FDQSxDQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFVBQUEsQ0FBQSxnQkFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLFdBQUEsRUFBQTs7O0FBR0EsVUFBQSxDQUFBLFVBQUEsR0FBQSxDQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQSxDQUFBLENBQUE7O0FBRUEsVUFBQSxDQUFBLGNBQUEsR0FBQSxZQUFBO0FBQ0EsbUJBQUEsQ0FBQSxjQUFBLEVBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxZQUFBLEVBQUE7O0FBRUEsZ0JBQUEsWUFBQSxLQUFBLFdBQUEsRUFBQTtBQUNBLHVCQUFBLENBQUEsR0FBQSxDQUFBLGlCQUFBLENBQUEsQ0FBQTthQUNBLE1BQUE7QUFDQSxzQkFBQSxDQUFBLGVBQUEsQ0FBQSxZQUFBLENBQUEsQ0FBQTthQUNBO1NBQ0EsQ0FBQSxTQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSxtQkFBQSxDQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQTtBQUNBLG1CQUFBLEdBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLGFBQUEsR0FBQSxVQUFBLE9BQUEsRUFBQTs7QUFFQSxtQkFBQSxDQUFBLG1CQUFBLENBQUEsTUFBQSxDQUFBLFlBQUEsQ0FBQSxPQUFBLEVBQUEsTUFBQSxDQUFBLFlBQUEsQ0FBQSxHQUFBLEVBQUEsT0FBQSxDQUFBLEVBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxlQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLGVBQUEsQ0FBQSxlQUFBLENBQUEsQ0FBQTtTQUNBLENBQUEsU0FBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsbUJBQUEsQ0FBQSxLQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7QUFDQSxtQkFBQSxHQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxZQUFBLEdBQUEsWUFBQTtBQUNBLG1CQUFBLENBQUEsU0FBQSxDQUFBLE1BQUEsQ0FBQSxZQUFBLENBQUEsT0FBQSxFQUFBLE1BQUEsQ0FBQSxZQUFBLENBQUEsR0FBQSxFQUFBLE1BQUEsQ0FBQSxZQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxlQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLGVBQUEsQ0FBQSxlQUFBLENBQUEsQ0FBQTtTQUNBLENBQUEsU0FBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsbUJBQUEsQ0FBQSxLQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7QUFDQSxtQkFBQSxHQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxlQUFBLEdBQUEsVUFBQSxZQUFBLEVBQUE7QUFDQSxZQUFBLFlBQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsU0FBQSxHQUFBLFlBQUEsQ0FBQSxRQUFBLENBQUE7QUFDQSxrQkFBQSxDQUFBLFlBQUEsR0FBQSxZQUFBLENBQUE7QUFDQSxrQkFBQSxDQUFBLFFBQUEsR0FBQSxXQUFBLENBQUEsUUFBQSxDQUFBLFlBQUEsQ0FBQSxDQUFBO0FBQ0Esa0JBQUEsQ0FBQSxTQUFBLEdBQUEsV0FBQSxDQUFBLFNBQUEsQ0FBQSxZQUFBLENBQUEsQ0FBQTtBQUNBLGtCQUFBLENBQUEsUUFBQSxHQUFBLE1BQUEsQ0FBQSxRQUFBLEdBQUEsQ0FBQSxHQUFBLElBQUEsR0FBQSxDQUFBLENBQUE7QUFDQSxrQkFBQSxDQUFBLGdCQUFBLEdBQUEsTUFBQSxDQUFBLFFBQUEsR0FBQSxDQUFBLEdBQUEsRUFBQSxHQUFBLENBQUEsQ0FBQTtBQUNBLGtCQUFBLENBQUEsVUFBQSxHQUFBLE1BQUEsQ0FBQSxRQUFBLEdBQUEsTUFBQSxDQUFBLFFBQUEsR0FBQSxNQUFBLENBQUEsZ0JBQUEsQ0FBQTtTQUNBO0tBQ0EsQ0FBQTs7QUFFQSxVQUFBLENBQUEsY0FBQSxFQUFBLENBQUE7Q0FDQSxDQUFBLENBQUE7QUNqRUEsQ0FBQSxZQUFBOztBQUVBLGdCQUFBLENBQUE7OztBQUdBLFFBQUEsQ0FBQSxNQUFBLENBQUEsT0FBQSxFQUFBLE1BQUEsSUFBQSxLQUFBLENBQUEsd0JBQUEsQ0FBQSxDQUFBOztBQUVBLFFBQUEsR0FBQSxHQUFBLE9BQUEsQ0FBQSxNQUFBLENBQUEsYUFBQSxFQUFBLEVBQUEsQ0FBQSxDQUFBOztBQUVBLE9BQUEsQ0FBQSxPQUFBLENBQUEsUUFBQSxFQUFBLFVBQUEsU0FBQSxFQUFBOztBQUVBLFlBQUEsQ0FBQSxNQUFBLENBQUEsRUFBQSxFQUFBLE1BQUEsSUFBQSxLQUFBLENBQUEsc0JBQUEsQ0FBQSxDQUFBOztBQUVBLFlBQUEsTUFBQSxDQUFBOztBQUVBLFlBQUEsU0FBQSxDQUFBLE1BQUEsRUFBQTtBQUNBLGtCQUFBLEdBQUEsRUFBQSxDQUFBLHVCQUFBLENBQUEsQ0FBQTtTQUNBLE1BQUE7QUFDQSxrQkFBQSxHQUFBLEVBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQTtTQUNBOztBQUVBLGVBQUEsTUFBQSxDQUFBO0tBRUEsQ0FBQSxDQUFBOzs7OztBQUtBLE9BQUEsQ0FBQSxRQUFBLENBQUEsYUFBQSxFQUFBO0FBQ0Esb0JBQUEsRUFBQSxvQkFBQTtBQUNBLG1CQUFBLEVBQUEsbUJBQUE7QUFDQSxxQkFBQSxFQUFBLHFCQUFBO0FBQ0Esc0JBQUEsRUFBQSxzQkFBQTtBQUNBLHdCQUFBLEVBQUEsd0JBQUE7QUFDQSxxQkFBQSxFQUFBLHFCQUFBO0tBQ0EsQ0FBQSxDQUFBOztBQUVBLE9BQUEsQ0FBQSxPQUFBLENBQUEsaUJBQUEsRUFBQSxVQUFBLFVBQUEsRUFBQSxFQUFBLEVBQUEsV0FBQSxFQUFBO0FBQ0EsWUFBQSxVQUFBLEdBQUE7QUFDQSxlQUFBLEVBQUEsV0FBQSxDQUFBLGdCQUFBO0FBQ0EsZUFBQSxFQUFBLFdBQUEsQ0FBQSxhQUFBO0FBQ0EsZUFBQSxFQUFBLFdBQUEsQ0FBQSxjQUFBO0FBQ0EsZUFBQSxFQUFBLFdBQUEsQ0FBQSxjQUFBO1NBQ0EsQ0FBQTtBQUNBLGVBQUE7QUFDQSx5QkFBQSxFQUFBLHVCQUFBLFFBQUEsRUFBQTtBQUNBLDBCQUFBLENBQUEsVUFBQSxDQUFBLFVBQUEsQ0FBQSxRQUFBLENBQUEsTUFBQSxDQUFBLEVBQUEsUUFBQSxDQUFBLENBQUE7QUFDQSx1QkFBQSxFQUFBLENBQUEsTUFBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBO2FBQ0E7U0FDQSxDQUFBO0tBQ0EsQ0FBQSxDQUFBOztBQUVBLE9BQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxhQUFBLEVBQUE7QUFDQSxxQkFBQSxDQUFBLFlBQUEsQ0FBQSxJQUFBLENBQUEsQ0FDQSxXQUFBLEVBQ0EsVUFBQSxTQUFBLEVBQUE7QUFDQSxtQkFBQSxTQUFBLENBQUEsR0FBQSxDQUFBLGlCQUFBLENBQUEsQ0FBQTtTQUNBLENBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQSxDQUFBOztBQUVBLE9BQUEsQ0FBQSxPQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBLE9BQUEsRUFBQSxVQUFBLEVBQUEsV0FBQSxFQUFBLEVBQUEsRUFBQTs7OztBQUlBLFlBQUEsQ0FBQSxlQUFBLEdBQUEsWUFBQTtBQUNBLG1CQUFBLENBQUEsQ0FBQSxPQUFBLENBQUEsSUFBQSxDQUFBO1NBQ0EsQ0FBQTs7QUFFQSxZQUFBLENBQUEsZUFBQSxHQUFBLFlBQUE7Ozs7O0FBS0EsZ0JBQUEsSUFBQSxDQUFBLGVBQUEsRUFBQSxFQUFBO0FBQ0EsdUJBQUEsRUFBQSxDQUFBLElBQUEsQ0FBQSxPQUFBLENBQUEsSUFBQSxDQUFBLENBQUE7YUFDQTs7Ozs7QUFLQSxtQkFBQSxLQUFBLENBQUEsR0FBQSxDQUFBLFVBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxpQkFBQSxDQUFBLFNBQUEsQ0FBQSxZQUFBO0FBQ0EsdUJBQUEsSUFBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBRUEsQ0FBQTs7QUFFQSxZQUFBLENBQUEsT0FBQSxHQUFBLFlBQUE7QUFDQSxnQkFBQSxJQUFBLENBQUEsZUFBQSxFQUFBLEVBQ0EsT0FBQSxDQUFBLENBQUEsT0FBQSxDQUFBLElBQUEsQ0FBQSxLQUFBLENBQUEsS0FFQSxPQUFBLEtBQUEsQ0FBQTtTQUNBLENBQUE7O0FBRUEsWUFBQSxDQUFBLEtBQUEsR0FBQSxVQUFBLFdBQUEsRUFBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxJQUFBLENBQUEsUUFBQSxFQUFBLFdBQUEsQ0FBQSxDQUNBLElBQUEsQ0FBQSxpQkFBQSxDQUFBLFNBQ0EsQ0FBQSxVQUFBLFFBQUEsRUFBQTtBQUNBLHVCQUFBLEVBQUEsQ0FBQSxNQUFBLENBQUEsRUFBQSxPQUFBLEVBQUEsNEJBQUEsRUFBQSxDQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FDQSxDQUFBOztBQUVBLFlBQUEsQ0FBQSxNQUFBLEdBQUEsWUFBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsU0FBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFlBQUE7QUFDQSx1QkFBQSxDQUFBLE9BQUEsRUFBQSxDQUFBO0FBQ0EsMEJBQUEsQ0FBQSxVQUFBLENBQUEsV0FBQSxDQUFBLGFBQUEsQ0FBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0EsQ0FBQTs7QUFFQSxpQkFBQSxpQkFBQSxDQUFBLFFBQUEsRUFBQTtBQUNBLGdCQUFBLElBQUEsR0FBQSxRQUFBLENBQUEsSUFBQSxDQUFBO0FBQ0EsbUJBQUEsQ0FBQSxNQUFBLENBQUEsSUFBQSxDQUFBLEVBQUEsRUFBQSxJQUFBLENBQUEsSUFBQSxDQUFBLENBQUE7QUFDQSxzQkFBQSxDQUFBLFVBQUEsQ0FBQSxXQUFBLENBQUEsWUFBQSxDQUFBLENBQUE7QUFDQSxtQkFBQSxJQUFBLENBQUEsSUFBQSxDQUFBO1NBQ0EsQ0FBQTtLQUVBLENBQUEsQ0FBQTs7QUFFQSxPQUFBLENBQUEsT0FBQSxDQUFBLFNBQUEsRUFBQSxVQUFBLFVBQUEsRUFBQSxXQUFBLEVBQUE7O0FBRUEsWUFBQSxJQUFBLEdBQUEsSUFBQSxDQUFBOztBQUVBLGtCQUFBLENBQUEsR0FBQSxDQUFBLFdBQUEsQ0FBQSxnQkFBQSxFQUFBLFlBQUE7QUFDQSxnQkFBQSxDQUFBLE9BQUEsRUFBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBOztBQUVBLGtCQUFBLENBQUEsR0FBQSxDQUFBLFdBQUEsQ0FBQSxjQUFBLEVBQUEsWUFBQTtBQUNBLGdCQUFBLENBQUEsT0FBQSxFQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7O0FBRUEsWUFBQSxDQUFBLEVBQUEsR0FBQSxJQUFBLENBQUE7QUFDQSxZQUFBLENBQUEsSUFBQSxHQUFBLElBQUEsQ0FBQTs7QUFFQSxZQUFBLENBQUEsTUFBQSxHQUFBLFVBQUEsU0FBQSxFQUFBLElBQUEsRUFBQTtBQUNBLGdCQUFBLENBQUEsRUFBQSxHQUFBLFNBQUEsQ0FBQTtBQUNBLGdCQUFBLENBQUEsSUFBQSxHQUFBLElBQUEsQ0FBQTtTQUNBLENBQUE7O0FBRUEsWUFBQSxDQUFBLE9BQUEsR0FBQSxZQUFBO0FBQ0EsZ0JBQUEsQ0FBQSxFQUFBLEdBQUEsSUFBQSxDQUFBO0FBQ0EsZ0JBQUEsQ0FBQSxJQUFBLEdBQUEsSUFBQSxDQUFBO1NBQ0EsQ0FBQTtLQUVBLENBQUEsQ0FBQTtDQUVBLENBQUEsRUFBQSxDQUFBOztBQ2pKQSxZQUFBLENBQUE7QUFDQSxHQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FDQSxLQUFBLENBQUEsTUFBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLEdBQUE7QUFDQSxtQkFBQSxFQUFBLG1CQUFBLEVBQ0EsQ0FBQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBOztBQ1BBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7O0FBRUEsa0JBQUEsQ0FBQSxLQUFBLENBQUEsT0FBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLFFBQUE7QUFDQSxtQkFBQSxFQUFBLHFCQUFBO0FBQ0Esa0JBQUEsRUFBQSxXQUFBO0tBQ0EsQ0FBQSxDQUFBO0NBRUEsQ0FBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxVQUFBLENBQUEsV0FBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLFdBQUEsRUFBQSxNQUFBLEVBQUE7O0FBRUEsVUFBQSxDQUFBLEtBQUEsR0FBQSxFQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsS0FBQSxHQUFBLElBQUEsQ0FBQTs7QUFFQSxVQUFBLENBQUEsU0FBQSxHQUFBLFVBQUEsU0FBQSxFQUFBOztBQUVBLGNBQUEsQ0FBQSxLQUFBLEdBQUEsSUFBQSxDQUFBOztBQUVBLG1CQUFBLENBQUEsS0FBQSxDQUFBLFNBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxZQUFBO0FBQ0Esa0JBQUEsQ0FBQSxFQUFBLENBQUEsTUFBQSxDQUFBLENBQUE7U0FDQSxDQUFBLFNBQUEsQ0FBQSxZQUFBO0FBQ0Esa0JBQUEsQ0FBQSxLQUFBLEdBQUEsNEJBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUVBLENBQUE7Q0FFQSxDQUFBLENBQUE7QUMzQkEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTs7QUFFQSxrQkFBQSxDQUNBLEtBQUEsQ0FBQSxhQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsZUFBQTtBQUNBLG1CQUFBLEVBQUEsbUNBQUE7QUFDQSxrQkFBQSxFQUFBLGtCQUFBO0FBQ0EsZUFBQSxFQUFBO0FBQ0EsaUJBQUEsRUFBQSxlQUFBLFdBQUEsRUFBQTtBQUNBLHVCQUFBLFdBQUEsQ0FBQSxjQUFBLEVBQUEsQ0FBQTthQUNBO0FBQ0EsZ0JBQUEsRUFBQSxjQUFBLFdBQUEsRUFBQTtBQUNBLHVCQUFBLFdBQUEsQ0FBQSxlQUFBLEVBQUEsQ0FBQTthQUNBO1NBQ0E7O0FBRUEsWUFBQSxFQUFBO0FBQ0Esd0JBQUEsRUFBQSxJQUFBO1NBQ0E7S0FDQSxDQUFBLENBQ0EsS0FBQSxDQUFBLGtCQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsVUFBQTtBQUNBLG1CQUFBLEVBQUEsd0NBQUE7S0FDQSxDQUFBLENBQ0EsS0FBQSxDQUFBLG9CQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsYUFBQTtBQUNBLG1CQUFBLEVBQUEsMENBQUE7QUFDQSxrQkFBQSxFQUFBLGtCQUFBO0tBQ0EsQ0FBQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxVQUFBLENBQUEsa0JBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxLQUFBLEVBQUEsS0FBQSxFQUFBLElBQUEsRUFBQSxZQUFBLEVBQUE7O0FBRUEsVUFBQSxDQUFBLEtBQUEsR0FBQSxLQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsSUFBQSxHQUFBLElBQUEsQ0FBQTs7QUFFQSxVQUFBLENBQUEsUUFBQSxHQUFBLFlBQUE7QUFDQSxhQUFBLENBQUEsR0FBQSxDQUFBLFlBQUEsRUFBQSxNQUFBLENBQUEsSUFBQSxDQUFBLENBQ0EsSUFBQSxDQUFBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsbUJBQUEsQ0FBQSxHQUFBLENBQUEsUUFBQSxDQUFBLElBQUEsQ0FBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxRQUFBLFlBQUEsQ0FBQSxTQUFBLEVBQUE7QUFDQSxjQUFBLENBQUEsWUFBQSxHQUFBLFVBQUEsTUFBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxVQUFBLEdBQUEsWUFBQSxDQUFBLFNBQUEsQ0FBQTtBQUNBLGtCQUFBLENBQUEsT0FBQSxHQUFBLE1BQUEsQ0FBQSxJQUFBLENBQUEsR0FBQSxDQUFBOztBQUVBLGlCQUFBLENBQUEsSUFBQSxDQUFBLGdCQUFBLEdBQUEsWUFBQSxDQUFBLFNBQUEsR0FBQSxVQUFBLEVBQUEsTUFBQSxDQUFBLENBQ0EsSUFBQSxDQUFBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsdUJBQUEsQ0FBQSxHQUFBLENBQUEsMkJBQUEsRUFBQSxRQUFBLENBQUEsSUFBQSxDQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FDQSxDQUFBO0tBQ0EsQ0FBQTtDQUVBLENBQUEsQ0FBQTs7QUFJQSxHQUFBLENBQUEsTUFBQSxDQUFBLGFBQUEsRUFBQSxZQUFBO0FBQ0EsV0FBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLFlBQUEsS0FBQSxLQUFBLEtBQUEsRUFBQTtBQUNBLG1CQUFBLGFBQUEsQ0FBQTtTQUNBLE1BQUE7QUFDQSxtQkFBQSxXQUFBLENBQUE7U0FDQTtLQUNBLENBQUE7Q0FDQSxDQUFBLENBQUE7O0FDbkVBLFlBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FDQSxLQUFBLENBQUEsVUFBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLGtCQUFBO0FBQ0EsbUJBQUEsRUFBQSwyQ0FBQTtBQUNBLGtCQUFBLEVBQUEsMkJBQUE7QUFDQSxlQUFBLEVBQUE7QUFDQSxrQkFBQSxFQUFBLGdCQUFBLE1BQUEsRUFBQTtBQUNBLHVCQUFBLE1BQUEsQ0FBQSxZQUFBLEVBQUEsQ0FBQTthQUNBO0FBQ0EsdUJBQUEsRUFBQSxxQkFBQSxNQUFBLEVBQUE7QUFDQSx1QkFBQSxNQUFBLENBQUEsV0FBQSxDQUFBO2FBQ0E7U0FDQTtLQUNBLENBQUEsQ0FDQSxLQUFBLENBQUEsZUFBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLFdBQUE7QUFDQSxtQkFBQSxFQUFBLGdEQUFBO0FBQ0Esa0JBQUEsRUFBQSwyQkFBQTtLQUNBLENBQUEsQ0FBQTtDQUNBLENBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsVUFBQSxDQUFBLDJCQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsV0FBQSxFQUFBLFlBQUEsRUFBQSxNQUFBLEVBQUEsV0FBQSxFQUFBLE1BQUEsRUFBQTtBQUNBLFVBQUEsQ0FBQSxNQUFBLEdBQUEsTUFBQSxDQUFBOztBQUVBLFFBQUEsWUFBQSxDQUFBLE9BQUEsRUFBQTtBQUNBLGNBQUEsQ0FBQSxRQUFBLENBQUEsWUFBQSxDQUFBLE9BQUEsQ0FBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsU0FBQSxHQUFBLEtBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFdBQUEsR0FBQSxVQUFBLE9BQUEsRUFBQTs7O0FBR0EsbUJBQUEsQ0FBQSxPQUFBLENBQUEsQ0FBQTs7QUFFQSxjQUFBLENBQUEsTUFBQSxDQUFBLE9BQUEsQ0FBQSxVQUFBLEtBQUEsRUFBQSxHQUFBLEVBQUE7QUFDQSxnQkFBQSxLQUFBLENBQUEsR0FBQSxLQUFBLE9BQUEsRUFBQTtBQUNBLHVCQUFBLE1BQUEsQ0FBQSxNQUFBLENBQUEsTUFBQSxDQUFBLEdBQUEsRUFBQSxDQUFBLENBQUEsQ0FBQTthQUNBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxVQUFBLENBQUEsU0FBQSxHQUFBLFlBQUE7QUFDQSxjQUFBLENBQUEsU0FBQSxDQUFBLE1BQUEsQ0FBQSxTQUFBLENBQUEsQ0FBQTtLQUNBLENBQUE7Q0FDQSxDQUFBLENBQUE7O0FDakRBLFlBQUEsQ0FBQTtBQUNBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUNBLEtBQUEsQ0FBQSxZQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEscUJBQUE7QUFDQSxtQkFBQSxFQUFBLCtDQUFBO0FBQ0Esa0JBQUEsRUFBQSw2QkFBQTtLQUNBLENBQUEsQ0FDQSxLQUFBLENBQUEsaUJBQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxhQUFBO0FBQ0EsbUJBQUEsRUFBQSxvREFBQTtBQUNBLGtCQUFBLEVBQUEsNkJBQUE7S0FDQSxDQUFBLENBQUE7Q0FDQSxDQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFVBQUEsQ0FBQSw2QkFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLFlBQUEsRUFBQSxLQUFBLEVBQUEsY0FBQSxFQUFBOztBQUVBLGtCQUFBLENBQUEsUUFBQSxFQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsT0FBQSxFQUFBO0FBQ0EsY0FBQSxDQUFBLFFBQUEsR0FBQSxPQUFBLENBQUE7S0FDQSxDQUFBLENBQUE7O0FBR0EsUUFBQSxZQUFBLENBQUEsU0FBQSxFQUFBO0FBQ0Esc0JBQUEsQ0FBQSxXQUFBLENBQUEsWUFBQSxDQUFBLFNBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLElBQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsV0FBQSxHQUFBLElBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBOztBQUVBLFVBQUEsQ0FBQSxXQUFBLEdBQUEsWUFBQTtBQUNBLHNCQUFBLENBQUEsV0FBQSxDQUFBLE1BQUEsQ0FBQSxXQUFBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLGFBQUEsR0FBQSxVQUFBLE9BQUEsRUFBQTtBQUNBLGNBQUEsQ0FBQSxRQUFBLENBQUEsT0FBQSxDQUFBLFVBQUEsWUFBQSxFQUFBO0FBQ0EsZ0JBQUEsT0FBQSxDQUFBLEdBQUEsS0FBQSxZQUFBLENBQUEsR0FBQSxFQUFBO0FBQ0Esb0JBQUEsS0FBQSxHQUFBLE1BQUEsQ0FBQSxRQUFBLENBQUEsT0FBQSxDQUFBLFlBQUEsQ0FBQSxDQUFBO0FBQ0EsdUJBQUEsTUFBQSxDQUFBLFFBQUEsQ0FBQSxNQUFBLENBQUEsS0FBQSxFQUFBLENBQUEsQ0FBQSxDQUFBO2FBQ0E7U0FDQSxDQUFBLENBQUE7QUFDQSxzQkFBQSxDQUFBLGFBQUEsQ0FBQSxPQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7S0FDQSxDQUFBO0NBRUEsQ0FBQSxDQUFBOztBQzFDQSxHQUFBLENBQUEsT0FBQSxDQUFBLGdCQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUE7O0FBRUEsV0FBQTs7QUFFQSxnQkFBQSxFQUFBLG9CQUFBO0FBQ0EsbUJBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxlQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxRQUFBLEVBQUE7QUFDQSx1QkFBQSxRQUFBLENBQUEsSUFBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7O0FBRUEsdUJBQUEsRUFBQSx5QkFBQSxRQUFBLEVBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsR0FBQSxDQUFBLGtCQUFBLEdBQUEsUUFBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsdUJBQUEsUUFBQSxDQUFBLElBQUEsQ0FBQTthQUNBLENBQUEsQ0FBQTtTQUNBOztBQUVBLHNCQUFBLEVBQUEsd0JBQUEsRUFBQSxFQUFBO0FBQ0EsbUJBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxnQkFBQSxHQUFBLEVBQUEsR0FBQSxVQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxRQUFBLEVBQUE7QUFDQSx1QkFBQSxRQUFBLENBQUEsSUFBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7O0FBRUEsbUJBQUEsRUFBQSxxQkFBQSxFQUFBLEVBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsR0FBQSxDQUFBLGdCQUFBLEdBQUEsRUFBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsdUJBQUEsUUFBQSxDQUFBLElBQUEsQ0FBQTthQUNBLENBQUEsQ0FBQTtTQUNBOztBQUVBLG1CQUFBLEVBQUEscUJBQUEsRUFBQSxFQUFBO0FBQ0EsbUJBQUEsS0FBQSxDQUFBLElBQUEsQ0FBQSxnQkFBQSxHQUFBLEVBQUEsQ0FBQSxDQUFBO1NBQ0E7O0FBRUEsbUJBQUEsRUFBQSxxQkFBQSxJQUFBLEVBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsR0FBQSxDQUFBLGVBQUEsRUFBQSxJQUFBLENBQUEsQ0FBQTtTQUNBOztBQUVBLHFCQUFBLEVBQUEsdUJBQUEsRUFBQSxFQUFBO0FBQ0EsbUJBQUEsS0FBQSxVQUFBLENBQUEsZ0JBQUEsR0FBQSxFQUFBLENBQUEsQ0FBQTtTQUNBOztBQUVBLGlCQUFBLEVBQUEscUJBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsR0FBQSxDQUFBLGtCQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxRQUFBLEVBQUE7QUFDQSx1QkFBQSxRQUFBLENBQUEsSUFBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7O0FBRUEsb0JBQUEsRUFBQSxzQkFBQSxTQUFBLEVBQUEsTUFBQSxFQUFBO0FBQ0EsbUJBQUEsS0FBQSxDQUFBLElBQUEsQ0FBQSxnQkFBQSxHQUFBLFNBQUEsR0FBQSxVQUFBLEVBQUEsTUFBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsdUJBQUEsUUFBQSxDQUFBLElBQUEsQ0FBQTthQUNBLENBQUEsQ0FBQTtTQUNBOztLQUVBLENBQUE7Q0FHQSxDQUFBLENBQUE7QUN2REEsWUFBQSxDQUFBO0FBQ0EsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTtBQUNBLGtCQUFBLENBQ0EsS0FBQSxDQUFBLFVBQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxXQUFBO0FBQ0EsbUJBQUEsRUFBQSwyQkFBQTtBQUNBLGtCQUFBLEVBQUEsb0JBQUE7S0FDQSxDQUFBLENBQ0EsS0FBQSxDQUFBLGVBQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxhQUFBO0FBQ0EsbUJBQUEsRUFBQSw4QkFBQTtBQUNBLGtCQUFBLEVBQUEsb0JBQUE7S0FDQSxDQUFBLENBQ0EsS0FBQSxDQUFBLHFCQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsbUJBQUE7QUFDQSxtQkFBQSxFQUFBLGtDQUFBO0FBQ0Esa0JBQUEsRUFBQSxvQkFBQTtLQUNBLENBQUEsQ0FBQTtDQUVBLENBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsVUFBQSxDQUFBLG9CQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsWUFBQSxFQUFBLGNBQUEsRUFBQTs7QUFFQSxVQUFBLENBQUEsZUFBQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLE9BQUEsR0FBQSxDQUFBLE9BQUEsRUFBQSxLQUFBLENBQUEsQ0FBQTtBQUNBLFVBQUEsQ0FBQSxNQUFBLEdBQUEsRUFBQSxDQUFBOztBQUVBLGtCQUFBLENBQUEsU0FBQSxFQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsTUFBQSxFQUFBO0FBQ0EsY0FBQSxDQUFBLE1BQUEsR0FBQSxNQUFBLENBQUE7S0FDQSxDQUFBLENBQUE7O0FBRUEsUUFBQSxZQUFBLENBQUEsZUFBQSxFQUFBO0FBQ0Esc0JBQUEsQ0FBQSxlQUFBLENBQUEsWUFBQSxDQUFBLGVBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLFFBQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsZUFBQSxHQUFBLFFBQUEsQ0FBQTtBQUNBLGtCQUFBLENBQUEsZUFBQSxHQUFBLFlBQUEsQ0FBQSxlQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQTs7QUFFQSxRQUFBLFlBQUEsQ0FBQSxTQUFBLEVBQUE7QUFDQSxzQkFBQSxDQUFBLGNBQUEsQ0FBQSxZQUFBLENBQUEsU0FBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsT0FBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxjQUFBLEdBQUEsT0FBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBOztBQUVBLHNCQUFBLENBQUEsV0FBQSxDQUFBLFlBQUEsQ0FBQSxTQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxJQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLFdBQUEsR0FBQSxJQUFBLENBQUE7O0FBRUEsa0JBQUEsQ0FBQSxNQUFBLEdBQUEsRUFBQSxDQUFBOztBQUVBLGlCQUFBLElBQUEsQ0FBQSxHQUFBLENBQUEsRUFBQSxDQUFBLEdBQUEsTUFBQSxDQUFBLFdBQUEsQ0FBQSxRQUFBLENBQUEsTUFBQSxFQUFBLENBQUEsRUFBQSxFQUFBO0FBQ0Esc0JBQUEsQ0FBQSxNQUFBLENBQUEsSUFBQSxDQUFBO0FBQ0EseUJBQUEsRUFBQSxNQUFBLENBQUEsV0FBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBLENBQUE7aUJBQ0EsQ0FBQSxDQUFBO2FBQ0E7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxXQUFBLEdBQUEsVUFBQSxFQUFBLEVBQUE7QUFDQSxzQkFBQSxDQUFBLFdBQUEsQ0FBQSxFQUFBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFVBQUEsR0FBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLFlBQUEsS0FBQSxHQUFBLENBQUEsRUFBQTtBQUNBLG1CQUFBLElBQUEsQ0FBQTtTQUNBLE1BQUE7QUFDQSxtQkFBQSxLQUFBLENBQUE7U0FDQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFVBQUEsR0FBQTtBQUNBLGVBQUEsRUFBQSxJQUFBO0FBQ0Esa0JBQUEsRUFBQSxZQUFBLENBQUEsU0FBQTtBQUNBLGFBQUEsRUFBQSxDQUFBO0FBQ0EsY0FBQSxFQUFBLEVBQUE7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxjQUFBLEdBQUEsS0FBQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxNQUFBLENBQUEsZ0JBQUEsRUFBQSxZQUFBO0FBQ0EsY0FBQSxDQUFBLG1CQUFBLEdBQUEsTUFBQSxDQUFBLGNBQUEsR0FBQSxXQUFBLEdBQUEsWUFBQSxDQUFBO0tBQ0EsQ0FBQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxZQUFBLEdBQUEsVUFBQSxNQUFBLEVBQUE7O0FBRUEsc0JBQUEsQ0FBQSxZQUFBLENBQUEsWUFBQSxDQUFBLFNBQUEsRUFBQSxNQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxNQUFBLEVBQUE7QUFDQSxtQkFBQSxDQUFBLEdBQUEsQ0FBQSxxQkFBQSxFQUFBLE1BQUEsQ0FBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBOztBQUVBLGNBQUEsQ0FBQSxVQUFBLEdBQUE7QUFDQSxtQkFBQSxFQUFBLElBQUE7QUFDQSxzQkFBQSxFQUFBLFlBQUEsQ0FBQSxTQUFBO0FBQ0EsaUJBQUEsRUFBQSxDQUFBO0FBQ0Esa0JBQUEsRUFBQSxFQUFBO1NBQ0EsQ0FBQTs7QUFFQSxjQUFBLENBQUEsY0FBQSxHQUFBLEtBQUEsQ0FBQTtLQUNBLENBQUE7Q0FDQSxDQUFBLENBQUE7O0FDaEdBLEdBQUEsQ0FBQSxPQUFBLENBQUEsZUFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBOztBQUVBLFdBQUE7O0FBRUEsc0JBQUEsRUFBQSx3QkFBQSxNQUFBLEVBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUE7QUFDQSxtQkFBQSxFQUFBLGFBQUE7QUFDQSxzQkFBQSxFQUFBLEtBQUE7QUFDQSxzQkFBQSxFQUFBLE1BQUE7YUFDQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsdUJBQUEsR0FBQSxDQUFBLElBQUEsQ0FBQTthQUNBLENBQUEsU0FBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsdUJBQUEsQ0FBQSxLQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7QUFDQSx1QkFBQSxHQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FDQTs7QUFFQSxpQkFBQSxFQUFBLHFCQUFBO0FBQ0EsbUJBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxnQkFBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsdUJBQUEsR0FBQSxDQUFBLElBQUEsQ0FBQTthQUNBLENBQUEsU0FBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsdUJBQUEsQ0FBQSxLQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7QUFDQSx1QkFBQSxHQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FDQTtLQUNBLENBQUE7Q0FDQSxDQUFBLENBQUE7QUMxQkEsWUFBQSxDQUFBOzs7OztBQUtBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUNBLEtBQUEsQ0FBQSxRQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsZ0JBQUE7QUFDQSxtQkFBQSxFQUFBLHVCQUFBO0FBQ0Esa0JBQUEsRUFBQSxrQkFBQTtLQUNBLENBQUEsQ0FBQTtDQUNBLENBQUEsQ0FBQTs7QUFHQSxHQUFBLENBQUEsVUFBQSxDQUFBLGtCQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsWUFBQSxFQUFBLGFBQUEsRUFBQTtBQUNBLFVBQUEsQ0FBQSxNQUFBLEdBQUEsRUFBQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLFFBQUEsR0FBQSxFQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsYUFBQSxHQUFBLEVBQUEsQ0FBQTs7QUFFQSxVQUFBLENBQUEsY0FBQSxHQUFBLENBQ0EsRUFBQSxJQUFBLEVBQUEsSUFBQSxFQUFBLEtBQUEsRUFBQSxFQUFBLEVBQUEsRUFDQSxFQUFBLElBQUEsRUFBQSxLQUFBLEVBQUEsS0FBQSxFQUFBLEVBQUEsRUFBQSxFQUNBLEVBQUEsSUFBQSxFQUFBLE1BQUEsRUFBQSxLQUFBLEVBQUEsR0FBQSxFQUFBLEVBQ0EsRUFBQSxJQUFBLEVBQUEsTUFBQSxFQUFBLEtBQUEsRUFBQSxHQUFBLEVBQUEsQ0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxjQUFBLEdBQUEsQ0FDQSxFQUFBLElBQUEsRUFBQSxLQUFBLEVBQUEsS0FBQSxFQUFBLEVBQUEsRUFBQSxFQUNBLEVBQUEsSUFBQSxFQUFBLE1BQUEsRUFBQSxLQUFBLEVBQUEsR0FBQSxFQUFBLEVBQ0EsRUFBQSxJQUFBLEVBQUEsTUFBQSxFQUFBLEtBQUEsRUFBQSxHQUFBLEVBQUEsRUFDQSxFQUFBLElBQUEsRUFBQSxlQUFBLEVBQUEsS0FBQSxFQUFBLEVBQUEsRUFBQSxDQUNBLENBQUE7O0FBRUEsYUFBQSxXQUFBLEdBQUE7QUFDQSxjQUFBLENBQUEsUUFBQSxHQUFBO0FBQ0EsaUJBQUEsRUFBQSxFQUFBO0FBQ0Esa0JBQUEsRUFBQSxFQUFBO0FBQ0Esa0JBQUEsRUFBQSxFQUFBO0FBQ0Esc0JBQUEsRUFBQSxFQUFBLEdBQUEsRUFBQSxFQUFBLEVBQUEsR0FBQSxFQUFBLEVBQUEsRUFBQTtBQUNBLG9CQUFBLEVBQUEsRUFBQTtTQUNBLENBQUE7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxZQUFBLEdBQUEsWUFBQTtBQUNBLHFCQUFBLENBQUEsU0FBQSxFQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsTUFBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxNQUFBLEdBQUEsTUFBQSxDQUFBO1NBQ0EsQ0FBQSxTQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSxtQkFBQSxDQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQTtBQUNBLG1CQUFBLEdBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLGdCQUFBLEdBQUEsWUFBQTtBQUNBLHFCQUFBLENBQUEsY0FBQSxDQUFBLE1BQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxRQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLGFBQUEsR0FBQSxRQUFBLENBQUE7QUFDQSxtQkFBQSxDQUFBLEdBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQTtTQUNBLENBQUEsU0FBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsbUJBQUEsQ0FBQSxLQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7QUFDQSxtQkFBQSxHQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxlQUFBLEdBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxZQUFBLEdBQUEsR0FBQSxNQUFBLENBQUEsUUFBQSxDQUFBLE1BQUEsQ0FBQSxPQUFBLENBQUEsS0FBQSxDQUFBLENBQUE7O0FBRUEsWUFBQSxHQUFBLEdBQUEsQ0FBQSxDQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLFFBQUEsQ0FBQSxNQUFBLENBQUEsTUFBQSxDQUFBLEdBQUEsRUFBQSxDQUFBLENBQUEsQ0FBQTtTQUNBLE1BQUE7QUFDQSxrQkFBQSxDQUFBLFFBQUEsQ0FBQSxNQUFBLENBQUEsSUFBQSxDQUFBLEtBQUEsQ0FBQSxDQUFBO1NBQ0E7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxXQUFBLEdBQUEsWUFBQTtBQUNBLG1CQUFBLEVBQUEsQ0FBQTtBQUNBLGNBQUEsQ0FBQSxhQUFBLEdBQUEsRUFBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxlQUFBLEVBQUEsQ0FBQTtBQUNBLFVBQUEsQ0FBQSxZQUFBLEVBQUEsQ0FBQTs7QUFFQSxRQUFBLFlBQUEsQ0FBQSxLQUFBLEVBQUE7QUFDQSxjQUFBLENBQUEsUUFBQSxDQUFBLEtBQUEsR0FBQSxZQUFBLENBQUEsS0FBQSxDQUFBO0FBQ0EsY0FBQSxDQUFBLGdCQUFBLEVBQUEsQ0FBQTtLQUNBO0NBQ0EsQ0FBQSxDQUFBO0FDckZBLEdBQUEsQ0FBQSxPQUFBLENBQUEsZUFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBOztBQUVBLFdBQUE7O0FBRUEscUJBQUEsRUFBQSx1QkFBQSxZQUFBLEVBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsSUFBQSxDQUFBLFlBQUEsRUFBQSxZQUFBLENBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxRQUFBLEVBQUE7QUFDQSx1QkFBQSxRQUFBLENBQUEsSUFBQSxDQUFBO2FBQ0EsQ0FBQSxTQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSx1QkFBQSxDQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQTtBQUNBLHVCQUFBLEdBQUEsQ0FBQTthQUNBLENBQUEsQ0FBQTtTQUNBOztLQUVBLENBQUE7Q0FFQSxDQUFBLENBQUE7QUNoQkEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTtBQUNBLGtCQUFBLENBQ0EsS0FBQSxDQUFBLFFBQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxTQUFBO0FBQ0EsbUJBQUEsRUFBQSx1QkFBQTtBQUNBLGtCQUFBLEVBQUEsWUFBQTtLQUNBLENBQUEsQ0FBQTtDQUNBLENBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsVUFBQSxDQUFBLFlBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxXQUFBLEVBQUEsTUFBQSxFQUFBLGFBQUEsRUFBQTs7QUFFQSxVQUFBLENBQUEsS0FBQSxHQUFBLElBQUEsQ0FBQTtBQUNBLFVBQUEsQ0FBQSxNQUFBLEdBQUEsRUFBQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxVQUFBLEdBQUEsVUFBQSxNQUFBLEVBQUE7QUFDQSxjQUFBLENBQUEsS0FBQSxHQUFBLElBQUEsQ0FBQTs7QUFFQSxxQkFBQSxDQUFBLGFBQUEsQ0FBQSxNQUFBLENBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxJQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLEVBQUEsQ0FBQSxNQUFBLENBQUEsQ0FBQTtBQUNBLG1CQUFBLFdBQUEsQ0FBQSxlQUFBLEVBQUEsQ0FBQTtTQUNBLENBQUEsU0FDQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxLQUFBLEdBQUEsOENBQUEsQ0FBQTtBQUNBLG1CQUFBLENBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTtDQUVBLENBQUEsQ0FBQTtBQzVCQSxZQUFBLENBQUE7QUFDQSxHQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FDQSxLQUFBLENBQUEsU0FBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLGlCQUFBO0FBQ0EsbUJBQUEsRUFBQSx5Q0FBQTtBQUNBLGtCQUFBLEVBQUEsMEJBQUE7S0FDQSxDQUFBLENBQ0EsS0FBQSxDQUFBLGNBQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxVQUFBO0FBQ0EsbUJBQUEsRUFBQSw4Q0FBQTtBQUNBLGtCQUFBLEVBQUEsMEJBQUE7S0FDQSxDQUFBLENBQUE7Q0FDQSxDQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFVBQUEsQ0FBQSwwQkFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLFlBQUEsRUFBQSxLQUFBLEVBQUE7O0FBRUEsU0FBQSxDQUFBLEdBQUEsQ0FBQSxZQUFBLENBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxRQUFBLEVBQUE7QUFDQSxjQUFBLENBQUEsS0FBQSxHQUFBLFFBQUEsQ0FBQSxJQUFBLENBQUE7S0FDQSxDQUFBLENBQUE7O0FBRUEsUUFBQSxDQUFBLENBQUEsWUFBQSxDQUFBLE1BQUEsRUFBQTtBQUNBLGFBQUEsQ0FBQSxHQUFBLENBQUEsYUFBQSxHQUFBLFlBQUEsQ0FBQSxNQUFBLENBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxRQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLFFBQUEsR0FBQSxRQUFBLENBQUEsSUFBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0E7OztBQUdBLFVBQUEsQ0FBQSxRQUFBLEdBQUEsWUFBQTtBQUNBLGFBQUEsQ0FBQSxHQUFBLENBQUEsWUFBQSxFQUFBLE1BQUEsQ0FBQSxRQUFBLENBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxRQUFBLEVBQUE7QUFDQSxtQkFBQSxDQUFBLEdBQUEsQ0FBQSxRQUFBLENBQUEsSUFBQSxDQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBOzs7QUFHQSxVQUFBLENBQUEsVUFBQSxHQUFBLFVBQUEsSUFBQSxFQUFBO0FBQ0EsY0FBQSxDQUFBLEtBQUEsQ0FBQSxPQUFBLENBQUEsVUFBQSxTQUFBLEVBQUE7QUFDQSxnQkFBQSxJQUFBLENBQUEsR0FBQSxLQUFBLFNBQUEsQ0FBQSxHQUFBLEVBQUE7QUFDQSxvQkFBQSxLQUFBLEdBQUEsTUFBQSxDQUFBLEtBQUEsQ0FBQSxPQUFBLENBQUEsU0FBQSxDQUFBLENBQUE7QUFDQSx1QkFBQSxNQUFBLENBQUEsS0FBQSxDQUFBLE1BQUEsQ0FBQSxLQUFBLEVBQUEsQ0FBQSxDQUFBLENBQUE7YUFDQTtTQUNBLENBQUEsQ0FBQTs7QUFFQSxhQUFBLFVBQUEsQ0FBQSxhQUFBLEdBQUEsSUFBQSxDQUFBLEdBQUEsQ0FBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLFFBQUEsRUFBQTtBQUNBLG1CQUFBLENBQUEsR0FBQSxDQUFBLFFBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBLENBQUE7Q0FFQSxDQUFBLENBQUE7O0FDcERBLFlBQUEsQ0FBQTtBQUNBLEdBQUEsQ0FBQSxPQUFBLENBQUEsaUJBQUEsRUFBQSxZQUFBOztBQUVBLFFBQUEsa0JBQUEsR0FBQSw0QkFBQSxHQUFBLEVBQUE7QUFDQSxlQUFBLEdBQUEsQ0FBQSxJQUFBLENBQUEsS0FBQSxDQUFBLElBQUEsQ0FBQSxNQUFBLEVBQUEsR0FBQSxHQUFBLENBQUEsTUFBQSxDQUFBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsUUFBQSxTQUFBLEdBQUEsQ0FDQSxlQUFBLEVBQ0EsdUJBQUEsRUFDQSxzQkFBQSxFQUNBLHVCQUFBLEVBQ0EseURBQUEsRUFDQSwwQ0FBQSxDQUNBLENBQUE7O0FBRUEsV0FBQTtBQUNBLGlCQUFBLEVBQUEsU0FBQTtBQUNBLHlCQUFBLEVBQUEsNkJBQUE7QUFDQSxtQkFBQSxrQkFBQSxDQUFBLFNBQUEsQ0FBQSxDQUFBO1NBQ0E7S0FDQSxDQUFBO0NBRUEsQ0FBQSxDQUFBO0FDdkJBLFlBQUEsQ0FBQTs7QUNBQSxZQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLE9BQUEsQ0FBQSxRQUFBLEVBQUEsVUFBQSxXQUFBLEVBQUEsS0FBQSxFQUFBOzs7QUFHQSxRQUFBLFlBQUEsR0FBQSx3QkFBQTtBQUNBLGVBQUEsV0FBQSxDQUFBLGVBQUEsRUFBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLElBQUEsRUFBQTtBQUNBLGdCQUFBLEdBQUEsR0FBQSxhQUFBLEdBQUEsSUFBQSxDQUFBLEdBQUEsR0FBQSxZQUFBLENBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsR0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBO1NBQ0EsQ0FBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLFFBQUEsRUFBQTtBQUNBLG1CQUFBLFFBQUEsQ0FBQSxJQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBOzs7QUFHQSxRQUFBLFdBQUEsR0FBQSxxQkFBQSxPQUFBLEVBQUE7QUFDQSxlQUFBLFdBQUEsQ0FBQSxlQUFBLEVBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxJQUFBLEVBQUE7QUFDQSxnQkFBQSxHQUFBLEdBQUEsYUFBQSxHQUFBLElBQUEsQ0FBQSxHQUFBLEdBQUEsVUFBQSxHQUFBLE9BQUEsR0FBQSxTQUFBLENBQUE7QUFDQSxtQkFBQSxLQUFBLFVBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQTtTQUNBLENBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSxtQkFBQSxHQUFBLENBQUEsSUFBQSxDQUFBO1NBQ0EsQ0FBQSxTQUNBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSxtQkFBQSxDQUFBLEdBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQTtBQUNBLG1CQUFBLEdBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsUUFBQSxRQUFBLEdBQUEsa0JBQUEsT0FBQSxFQUFBO0FBQ0EsZUFBQSxXQUFBLENBQUEsZUFBQSxFQUFBLENBQ0EsSUFBQSxDQUFBLFVBQUEsSUFBQSxFQUFBO0FBQ0EsZ0JBQUEsR0FBQSxHQUFBLGFBQUEsR0FBQSxJQUFBLENBQUEsR0FBQSxHQUFBLFVBQUEsR0FBQSxPQUFBLENBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsR0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBO1NBQ0EsQ0FBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLG1CQUFBLEdBQUEsQ0FBQSxJQUFBLENBQUE7U0FDQSxDQUFBLFNBQ0EsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLG1CQUFBLENBQUEsR0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBO0FBQ0EsbUJBQUEsR0FBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxRQUFBLFNBQUEsR0FBQSxtQkFBQSxLQUFBLEVBQUE7QUFDQSxlQUFBLFdBQUEsQ0FBQSxlQUFBLEVBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxJQUFBLEVBQUE7QUFDQSxnQkFBQSxHQUFBLEdBQUEsYUFBQSxHQUFBLElBQUEsQ0FBQSxHQUFBLEdBQUEsVUFBQSxHQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUE7QUFDQSxtQkFBQSxDQUFBLEdBQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsR0FBQSxFQUFBLEtBQUEsQ0FBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxXQUFBO0FBQ0Esb0JBQUEsRUFBQSxZQUFBO0FBQ0EsbUJBQUEsRUFBQSxXQUFBO0FBQ0EsZ0JBQUEsRUFBQSxRQUFBO0FBQ0EsaUJBQUEsRUFBQSxTQUFBO0tBQ0EsQ0FBQTtDQUNBLENBQUEsQ0FBQTs7QUM3REEsWUFBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxPQUFBLENBQUEsT0FBQSxFQUFBLFVBQUEsV0FBQSxFQUFBLEtBQUEsRUFBQTs7QUFFQSxRQUFBLFdBQUEsR0FBQSx1QkFBQTtBQUNBLGVBQUEsV0FBQSxDQUFBLGVBQUEsRUFBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLElBQUEsRUFBQTtBQUNBLGdCQUFBLEdBQUEsR0FBQSxhQUFBLENBQUE7QUFDQSxtQkFBQSxDQUFBLEdBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7U0FDQSxDQUFBLENBQ0EsSUFBQSxDQUFBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsbUJBQUEsUUFBQSxDQUFBLElBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsV0FBQTtBQUNBLG1CQUFBLEVBQUEsV0FBQTtLQUNBLENBQUE7Q0FDQSxDQUFBLENBQUE7Ozs7QUNoQkEsWUFBQSxDQUFBO0FBQ0EsR0FBQSxDQUFBLFNBQUEsQ0FBQSxlQUFBLEVBQUEsWUFBQTtBQUNBLFdBQUE7QUFDQSxnQkFBQSxFQUFBLEdBQUE7QUFDQSxtQkFBQSxFQUFBLHlEQUFBO0tBQ0EsQ0FBQTtDQUNBLENBQUEsQ0FBQTtBQ1JBLFlBQUEsQ0FBQTtBQUNBLEdBQUEsQ0FBQSxTQUFBLENBQUEsUUFBQSxFQUFBLFVBQUEsVUFBQSxFQUFBLFdBQUEsRUFBQSxXQUFBLEVBQUEsTUFBQSxFQUFBOzs7OztBQUtBLFdBQUE7QUFDQSxnQkFBQSxFQUFBLEdBQUE7QUFDQSxhQUFBLEVBQUEsRUFBQTtBQUNBLG1CQUFBLEVBQUEseUNBQUE7QUFDQSxZQUFBLEVBQUEsY0FBQSxLQUFBLEVBQUE7QUFDQSxpQkFBQSxDQUFBLEtBQUEsR0FBQSxDQUNBLEVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQSxLQUFBLEVBQUEsTUFBQSxFQUFBLEVBQ0EsRUFBQSxLQUFBLEVBQUEsVUFBQSxFQUFBLEtBQUEsRUFBQSxVQUFBLEVBQUEsRUFDQSxFQUFBLEtBQUEsRUFBQSxNQUFBLEVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQSxFQUNBLEVBQUEsS0FBQSxFQUFBLGVBQUEsRUFBQSxLQUFBLEVBQUEsYUFBQSxFQUFBLElBQUEsRUFBQSxJQUFBLEVBQUEsQ0FDQSxDQUFBO0FBQ0EsaUJBQUEsQ0FBQSxVQUFBLEdBQUEsQ0FDQSxFQUFBLEtBQUEsRUFBQSxvQkFBQSxFQUFBLEtBQUEsRUFBQSxZQUFBLEVBQUEsS0FBQSxFQUFBLElBQUEsRUFBQSxFQUNBLEVBQUEsS0FBQSxFQUFBLGtCQUFBLEVBQUEsS0FBQSxFQUFBLFVBQUEsRUFBQSxLQUFBLEVBQUEsSUFBQSxFQUFBLEVBQ0EsRUFBQSxLQUFBLEVBQUEsaUJBQUEsRUFBQSxLQUFBLEVBQUEsU0FBQSxFQUFBLEtBQUEsRUFBQSxJQUFBLEVBQUEsQ0FDQSxDQUFBOztBQUVBLGlCQUFBLENBQUEsSUFBQSxHQUFBLElBQUEsQ0FBQTtBQUNBLGlCQUFBLENBQUEsZUFBQSxHQUFBLElBQUEsQ0FBQTs7QUFFQSxpQkFBQSxDQUFBLFVBQUEsR0FBQSxZQUFBO0FBQ0EsdUJBQUEsV0FBQSxDQUFBLGVBQUEsRUFBQSxDQUFBO2FBQ0EsQ0FBQTs7QUFFQSxpQkFBQSxDQUFBLE9BQUEsR0FBQSxZQUFBO0FBQ0EsdUJBQUEsV0FBQSxDQUFBLE9BQUEsRUFBQSxDQUFBO2FBQ0EsQ0FBQTs7QUFFQSxpQkFBQSxDQUFBLE1BQUEsR0FBQSxZQUFBO0FBQ0EsMkJBQUEsQ0FBQSxNQUFBLEVBQUEsQ0FBQSxJQUFBLENBQUEsWUFBQTtBQUNBLDBCQUFBLENBQUEsRUFBQSxDQUFBLE1BQUEsQ0FBQSxDQUFBO2lCQUNBLENBQUEsQ0FBQTthQUNBLENBQUE7O0FBRUEsaUJBQUEsQ0FBQSxNQUFBLEdBQUEsWUFBQTtBQUNBLHNCQUFBLENBQUEsRUFBQSxDQUFBLFFBQUEsRUFBQSxFQUFBLEtBQUEsRUFBQSxLQUFBLENBQUEsZUFBQSxFQUFBLENBQUEsQ0FBQTthQUNBLENBQUE7O0FBRUEsZ0JBQUEsT0FBQSxHQUFBLG1CQUFBO0FBQ0EsMkJBQUEsQ0FBQSxlQUFBLEVBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxJQUFBLEVBQUE7QUFDQSx5QkFBQSxDQUFBLElBQUEsR0FBQSxJQUFBLENBQUE7aUJBQ0EsQ0FBQSxDQUFBO2FBQ0EsQ0FBQTs7QUFFQSxnQkFBQSxVQUFBLEdBQUEsc0JBQUE7QUFDQSxxQkFBQSxDQUFBLElBQUEsR0FBQSxJQUFBLENBQUE7YUFDQSxDQUFBOztBQUdBLG1CQUFBLEVBQUEsQ0FBQTs7QUFFQSxzQkFBQSxDQUFBLEdBQUEsQ0FBQSxXQUFBLENBQUEsWUFBQSxFQUFBLE9BQUEsQ0FBQSxDQUFBO0FBQ0Esc0JBQUEsQ0FBQSxHQUFBLENBQUEsV0FBQSxDQUFBLGFBQUEsRUFBQSxVQUFBLENBQUEsQ0FBQTtBQUNBLHNCQUFBLENBQUEsR0FBQSxDQUFBLFdBQUEsQ0FBQSxjQUFBLEVBQUEsVUFBQSxDQUFBLENBQUE7U0FFQTs7S0FFQSxDQUFBO0NBRUEsQ0FBQSxDQUFBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG52YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ0Z1bGxzdGFja0dlbmVyYXRlZEFwcCcsIFsndWkucm91dGVyJywgJ2ZzYVByZUJ1aWx0JywgJ3VpLmJvb3RzdHJhcCddKTtcblxuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHVybFJvdXRlclByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlcikge1xuICAgIC8vIFRoaXMgdHVybnMgb2ZmIGhhc2hiYW5nIHVybHMgKC8jYWJvdXQpIGFuZCBjaGFuZ2VzIGl0IHRvIHNvbWV0aGluZyBub3JtYWwgKC9hYm91dClcbiAgICAkbG9jYXRpb25Qcm92aWRlci5odG1sNU1vZGUodHJ1ZSk7XG4gICAgLy8gSWYgd2UgZ28gdG8gYSBVUkwgdGhhdCB1aS1yb3V0ZXIgZG9lc24ndCBoYXZlIHJlZ2lzdGVyZWQsIGdvIHRvIHRoZSBcIi9cIiB1cmwuXG4gICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnLycpO1xufSk7XG5cblxuLy8gVGhpcyBhcHAucnVuIGlzIGZvciBjb250cm9sbGluZyBhY2Nlc3MgdG8gc3BlY2lmaWMgc3RhdGVzLlxuYXBwLnJ1bihmdW5jdGlvbiAoJHJvb3RTY29wZSwgQXV0aFNlcnZpY2UsICRzdGF0ZSkge1xuXG4gICAgLy8gVGhlIGdpdmVuIHN0YXRlIHJlcXVpcmVzIGFuIGF1dGhlbnRpY2F0ZWQgdXNlci5cbiAgICB2YXIgZGVzdGluYXRpb25TdGF0ZVJlcXVpcmVzQXV0aCA9IGZ1bmN0aW9uIChzdGF0ZSkge1xuICAgICAgICByZXR1cm4gc3RhdGUuZGF0YSAmJiBzdGF0ZS5kYXRhLmF1dGhlbnRpY2F0ZTtcbiAgICB9O1xuXG4gICAgLy8gJHN0YXRlQ2hhbmdlU3RhcnQgaXMgYW4gZXZlbnQgZmlyZWRcbiAgICAvLyB3aGVuZXZlciB0aGUgcHJvY2VzcyBvZiBjaGFuZ2luZyBhIHN0YXRlIGJlZ2lucy5cbiAgICAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3RhcnQnLCBmdW5jdGlvbiAoZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zKSB7XG5cbiAgICAgICAgaWYgKCFkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoKHRvU3RhdGUpKSB7XG4gICAgICAgICAgICAvLyBUaGUgZGVzdGluYXRpb24gc3RhdGUgZG9lcyBub3QgcmVxdWlyZSBhdXRoZW50aWNhdGlvblxuICAgICAgICAgICAgLy8gU2hvcnQgY2lyY3VpdCB3aXRoIHJldHVybi5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKSkge1xuICAgICAgICAgICAgLy8gVGhlIHVzZXIgaXMgYXV0aGVudGljYXRlZC5cbiAgICAgICAgICAgIC8vIFNob3J0IGNpcmN1aXQgd2l0aCByZXR1cm4uXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDYW5jZWwgbmF2aWdhdGluZyB0byBuZXcgc3RhdGUuXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICAgLy8gSWYgYSB1c2VyIGlzIHJldHJpZXZlZCwgdGhlbiByZW5hdmlnYXRlIHRvIHRoZSBkZXN0aW5hdGlvblxuICAgICAgICAgICAgLy8gKHRoZSBzZWNvbmQgdGltZSwgQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCkgd2lsbCB3b3JrKVxuICAgICAgICAgICAgLy8gb3RoZXJ3aXNlLCBpZiBubyB1c2VyIGlzIGxvZ2dlZCBpbiwgZ28gdG8gXCJsb2dpblwiIHN0YXRlLlxuICAgICAgICAgICAgaWYgKHVzZXIpIHtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28odG9TdGF0ZS5uYW1lLCB0b1BhcmFtcyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnbG9naW4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICB9KTtcblxufSk7IiwiYXBwLmZhY3RvcnkoJ0NhcnRGYWN0b3J5JywgZnVuY3Rpb24gKCRodHRwKSB7XG5cbiAgICByZXR1cm4ge1xuXG4gICAgICAgIGdldEN1cnJlbnRVc2VyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyB0ZW1wb3JhcnkgdXNlciB3b3JrZmxvd1xuICAgICAgICAgICAgLy8gZ2V0IGN1cnJlbnQgdXNlciBmcm9tIGNvb2tpZSBpZFxuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS91c2Vycy9jdXJyZW50dXNlci8nKS50aGVuKGZ1bmN0aW9uKHJlcyl7XG4gICAgICAgICAgICAgICAgaWYgKHJlcy5kYXRhKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzLmRhdGFbMF07XG4gICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVycjtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGRlbGV0ZVByb2R1Y3RJbkNhcnQ6IGZ1bmN0aW9uICh1c2VySUQsIG9yZGVySUQsIHByb2R1Y3RJRCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLmRlbGV0ZSgnL2FwaS91c2Vycy8nKyB1c2VySUQgKyAnL29yZGVycy8nICsgb3JkZXJJRCArICcvcHJvZHVjdHMvJyArIHByb2R1Y3RJRClcbiAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5kYXRhO1xuICAgICAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlcnI7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfSxcblxuICAgICAgICBwcmljZVN1bTogZnVuY3Rpb24gKGN1cnJlbnRPcmRlcikge1xuICAgICAgICAgICAgdmFyIHRvdGFsID0gMC4wO1xuXG4gICAgICAgICAgICBjdXJyZW50T3JkZXIucHJvZHVjdHMuZm9yRWFjaChmdW5jdGlvbihlbGVtKSB7XG4gICAgICAgICAgICAgICAgdG90YWwgKz0gZWxlbS5pZC5wcmljZSAqIGVsZW0ucXVhbnRpdHk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIHRvdGFsO1xuICAgICAgICB9LFxuXG4gICAgICAgIGl0ZW1Db3VudDogZnVuY3Rpb24gKGN1cnJlbnRPcmRlcikge1xuICAgICAgICAgICAgdmFyIHRvdGFsID0gMDtcblxuICAgICAgICAgICAgY3VycmVudE9yZGVyLnByb2R1Y3RzLmZvckVhY2goZnVuY3Rpb24oZWxlbSkge1xuICAgICAgICAgICAgICAgIHRvdGFsICs9IGVsZW0ucXVhbnRpdHk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIHRvdGFsO1xuICAgICAgICB9LFxuXG4gICAgICAgIHNhdmVPcmRlcjogZnVuY3Rpb24odXNlcklELCBvcmRlcklELCBjdXJyZW50T3JkZXIpIHsgXG4gICAgICAgICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2FwaS91c2Vycy8nKyB1c2VySUQgKyAnL29yZGVycy8nICsgb3JkZXJJRCwgY3VycmVudE9yZGVyKS50aGVuKGZ1bmN0aW9uKHJlcyl7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXMuZGF0YTtcbiAgICAgICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXJyO1xuICAgICAgICAgICAgICAgIH0pOyAgICAgICBcbiAgICAgICAgfVxuXG4gICAgfTtcblxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG4vL1RoZSBDb25maWcgYmVsb3cgZGVmaW5lcyB0aGUgL2NhcnQgc3RhdGUsIHdoaWNoIHdpbGxcbi8vc2hvdyBhbGwgcHJvZHVjdHMgaW4gdGhlIGNhcnQuXG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKXtcbiAgICAkc3RhdGVQcm92aWRlclxuICAgICAgICAuc3RhdGUoJ2NhcnQnLCB7XG4gICAgICAgICAgICB1cmw6ICcvY2FydCcsXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NhcnQvY2FydC5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdDYXJ0Q29udHJvbGxlcidcbiAgICAgICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0NhcnRDb250cm9sbGVyJywgZnVuY3Rpb24oJHNjb3BlLCBDYXJ0RmFjdG9yeSkge1xuICAgIC8vIHRlbXBvcmFyeSB1c2VyIHdvcmtmbG93XG4gICAgLy8gZ2V0IGN1cnJlbnQgdXNlciBmcm9tIGNvb2tpZSBpZFxuICAgICRzY29wZS5xdWFudGl0aWVzID0gWzEsMiwzLDQsNSw2LDcsOCw5XTtcblxuICAgICRzY29wZS5pbml0aWFsaXplQ2FydCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBDYXJ0RmFjdG9yeS5nZXRDdXJyZW50VXNlcigpLnRoZW4oZnVuY3Rpb24oY3VycmVudE9yZGVyKSB7XG5cbiAgICAgICAgICAgIGlmIChjdXJyZW50T3JkZXIgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ25vdGhpbmcgaW4gY2FydCcpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuZGVmaW5lQ2FydFNjb3BlKGN1cnJlbnRPcmRlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICAgcmV0dXJuIGVycjtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgJHNjb3BlLmRlbGV0ZVByb2R1Y3QgPSBmdW5jdGlvbihwcm9kdWN0KSB7XG4gICAgICAvL0RFTEVURSAvYXBpL3VzZXJzLzp1c2VyaWQvb3JkZXJzLzphbm9yZGVyaWQvcHJvZHVjdHMvOmFwcm9kdWN0SURcbiAgICAgICAgQ2FydEZhY3RvcnkuZGVsZXRlUHJvZHVjdEluQ2FydCgkc2NvcGUuY3VycmVudE9yZGVyLnVzZXJfaWQsICRzY29wZS5jdXJyZW50T3JkZXIuX2lkLCBwcm9kdWN0LmlkLl9pZCkudGhlbihmdW5jdGlvbihuZXdDdXJyZW50T3JkZXIpIHtcbiAgICAgICAgICAgICRzY29wZS5kZWZpbmVDYXJ0U2NvcGUobmV3Q3VycmVudE9yZGVyKTtcbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgICAgICByZXR1cm4gZXJyO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAkc2NvcGUuc2F2ZVF1YW50aXR5ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIENhcnRGYWN0b3J5LnNhdmVPcmRlcigkc2NvcGUuY3VycmVudE9yZGVyLnVzZXJfaWQsICRzY29wZS5jdXJyZW50T3JkZXIuX2lkLCAkc2NvcGUuY3VycmVudE9yZGVyKS50aGVuKGZ1bmN0aW9uKG5ld0N1cnJlbnRPcmRlcikge1xuICAgICAgICAgICAgJHNjb3BlLmRlZmluZUNhcnRTY29wZShuZXdDdXJyZW50T3JkZXIpO1xuICAgICAgICB9KS5jYXRjaChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgIHJldHVybiBlcnI7XG4gICAgICAgIH0pOyAgXG4gICAgfVxuXG4gICAgJHNjb3BlLmRlZmluZUNhcnRTY29wZSA9IGZ1bmN0aW9uIChjdXJyZW50T3JkZXIpIHtcbiAgICAgICAgaWYgKGN1cnJlbnRPcmRlcikge1xuICAgICAgICAgICAgJHNjb3BlLm9yZGVyRGF0YSA9IGN1cnJlbnRPcmRlci5wcm9kdWN0cztcbiAgICAgICAgICAgICRzY29wZS5jdXJyZW50T3JkZXIgPSBjdXJyZW50T3JkZXI7XG4gICAgICAgICAgICAkc2NvcGUucHJpY2VTdW0gPSBDYXJ0RmFjdG9yeS5wcmljZVN1bShjdXJyZW50T3JkZXIpO1xuICAgICAgICAgICAgJHNjb3BlLml0ZW1Db3VudCA9IENhcnRGYWN0b3J5Lml0ZW1Db3VudChjdXJyZW50T3JkZXIpO1xuICAgICAgICAgICAgJHNjb3BlLnNhbGVzVGF4ID0gJHNjb3BlLnByaWNlU3VtID4gMCA/IDI4LjUwIDogMDtcbiAgICAgICAgICAgICRzY29wZS5zaGlwcGluZ0hhbmRsaW5nID0gJHNjb3BlLnByaWNlU3VtID4gMCA/IDIwLjAwIDogMDtcbiAgICAgICAgICAgICRzY29wZS50b3RhbE9yZGVyID0gJHNjb3BlLnByaWNlU3VtICsgJHNjb3BlLnNhbGVzVGF4ICsgJHNjb3BlLnNoaXBwaW5nSGFuZGxpbmc7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAkc2NvcGUuaW5pdGlhbGl6ZUNhcnQoKTtcbn0pOyIsIihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvLyBIb3BlIHlvdSBkaWRuJ3QgZm9yZ2V0IEFuZ3VsYXIhIER1aC1kb3kuXG4gICAgaWYgKCF3aW5kb3cuYW5ndWxhcikgdGhyb3cgbmV3IEVycm9yKCdJIGNhblxcJ3QgZmluZCBBbmd1bGFyIScpO1xuXG4gICAgdmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdmc2FQcmVCdWlsdCcsIFtdKTtcblxuICAgIGFwcC5mYWN0b3J5KCdTb2NrZXQnLCBmdW5jdGlvbiAoJGxvY2F0aW9uKSB7XG5cbiAgICAgICAgaWYgKCF3aW5kb3cuaW8pIHRocm93IG5ldyBFcnJvcignc29ja2V0LmlvIG5vdCBmb3VuZCEnKTtcblxuICAgICAgICB2YXIgc29ja2V0O1xuXG4gICAgICAgIGlmICgkbG9jYXRpb24uJCRwb3J0KSB7XG4gICAgICAgICAgICBzb2NrZXQgPSBpbygnaHR0cDovL2xvY2FsaG9zdDoxMzM3Jyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzb2NrZXQgPSBpbygnLycpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHNvY2tldDtcblxuICAgIH0pO1xuXG4gICAgLy8gQVVUSF9FVkVOVFMgaXMgdXNlZCB0aHJvdWdob3V0IG91ciBhcHAgdG9cbiAgICAvLyBicm9hZGNhc3QgYW5kIGxpc3RlbiBmcm9tIGFuZCB0byB0aGUgJHJvb3RTY29wZVxuICAgIC8vIGZvciBpbXBvcnRhbnQgZXZlbnRzIGFib3V0IGF1dGhlbnRpY2F0aW9uIGZsb3cuXG4gICAgYXBwLmNvbnN0YW50KCdBVVRIX0VWRU5UUycsIHtcbiAgICAgICAgbG9naW5TdWNjZXNzOiAnYXV0aC1sb2dpbi1zdWNjZXNzJyxcbiAgICAgICAgbG9naW5GYWlsZWQ6ICdhdXRoLWxvZ2luLWZhaWxlZCcsXG4gICAgICAgIGxvZ291dFN1Y2Nlc3M6ICdhdXRoLWxvZ291dC1zdWNjZXNzJyxcbiAgICAgICAgc2Vzc2lvblRpbWVvdXQ6ICdhdXRoLXNlc3Npb24tdGltZW91dCcsXG4gICAgICAgIG5vdEF1dGhlbnRpY2F0ZWQ6ICdhdXRoLW5vdC1hdXRoZW50aWNhdGVkJyxcbiAgICAgICAgbm90QXV0aG9yaXplZDogJ2F1dGgtbm90LWF1dGhvcml6ZWQnXG4gICAgfSk7XG5cbiAgICBhcHAuZmFjdG9yeSgnQXV0aEludGVyY2VwdG9yJywgZnVuY3Rpb24gKCRyb290U2NvcGUsICRxLCBBVVRIX0VWRU5UUykge1xuICAgICAgICB2YXIgc3RhdHVzRGljdCA9IHtcbiAgICAgICAgICAgIDQwMTogQVVUSF9FVkVOVFMubm90QXV0aGVudGljYXRlZCxcbiAgICAgICAgICAgIDQwMzogQVVUSF9FVkVOVFMubm90QXV0aG9yaXplZCxcbiAgICAgICAgICAgIDQxOTogQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsXG4gICAgICAgICAgICA0NDA6IEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXNwb25zZUVycm9yOiBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3Qoc3RhdHVzRGljdFtyZXNwb25zZS5zdGF0dXNdLCByZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdChyZXNwb25zZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSk7XG5cbiAgICBhcHAuY29uZmlnKGZ1bmN0aW9uICgkaHR0cFByb3ZpZGVyKSB7XG4gICAgICAgICRodHRwUHJvdmlkZXIuaW50ZXJjZXB0b3JzLnB1c2goW1xuICAgICAgICAgICAgJyRpbmplY3RvcicsXG4gICAgICAgICAgICBmdW5jdGlvbiAoJGluamVjdG9yKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRpbmplY3Rvci5nZXQoJ0F1dGhJbnRlcmNlcHRvcicpO1xuICAgICAgICAgICAgfVxuICAgICAgICBdKTtcbiAgICB9KTtcblxuICAgIGFwcC5zZXJ2aWNlKCdBdXRoU2VydmljZScsIGZ1bmN0aW9uICgkaHR0cCwgU2Vzc2lvbiwgJHJvb3RTY29wZSwgQVVUSF9FVkVOVFMsICRxKSB7XG5cbiAgICAgICAgLy8gVXNlcyB0aGUgc2Vzc2lvbiBmYWN0b3J5IHRvIHNlZSBpZiBhblxuICAgICAgICAvLyBhdXRoZW50aWNhdGVkIHVzZXIgaXMgY3VycmVudGx5IHJlZ2lzdGVyZWQuXG4gICAgICAgIHRoaXMuaXNBdXRoZW50aWNhdGVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICEhU2Vzc2lvbi51c2VyO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0TG9nZ2VkSW5Vc2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8gSWYgYW4gYXV0aGVudGljYXRlZCBzZXNzaW9uIGV4aXN0cywgd2VcbiAgICAgICAgICAgIC8vIHJldHVybiB0aGUgdXNlciBhdHRhY2hlZCB0byB0aGF0IHNlc3Npb25cbiAgICAgICAgICAgIC8vIHdpdGggYSBwcm9taXNlLiBUaGlzIGVuc3VyZXMgdGhhdCB3ZSBjYW5cbiAgICAgICAgICAgIC8vIGFsd2F5cyBpbnRlcmZhY2Ugd2l0aCB0aGlzIG1ldGhvZCBhc3luY2hyb25vdXNseS5cbiAgICAgICAgICAgIGlmICh0aGlzLmlzQXV0aGVudGljYXRlZCgpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLndoZW4oU2Vzc2lvbi51c2VyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gTWFrZSByZXF1ZXN0IEdFVCAvc2Vzc2lvbi5cbiAgICAgICAgICAgIC8vIElmIGl0IHJldHVybnMgYSB1c2VyLCBjYWxsIG9uU3VjY2Vzc2Z1bExvZ2luIHdpdGggdGhlIHJlc3BvbnNlLlxuICAgICAgICAgICAgLy8gSWYgaXQgcmV0dXJucyBhIDQwMSByZXNwb25zZSwgd2UgY2F0Y2ggaXQgYW5kIGluc3RlYWQgcmVzb2x2ZSB0byBudWxsLlxuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL3Nlc3Npb24nKS50aGVuKG9uU3VjY2Vzc2Z1bExvZ2luKS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9O1xuXG5cdFx0dGhpcy5pc0FkbWluID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiAodGhpcy5pc0F1dGhlbnRpY2F0ZWQoKSlcblx0XHRcdFx0cmV0dXJuICEhU2Vzc2lvbi51c2VyLmFkbWluO1xuXHRcdFx0ZWxzZVxuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0dGhpcy5sb2dpbiA9IGZ1bmN0aW9uIChjcmVkZW50aWFscykge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9sb2dpbicsIGNyZWRlbnRpYWxzKVxuICAgICAgICAgICAgICAgIC50aGVuKG9uU3VjY2Vzc2Z1bExvZ2luKVxuICAgICAgICAgICAgICAgIC5jYXRjaChmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdCh7IG1lc3NhZ2U6ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLicgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5sb2dvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvbG9nb3V0JykudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgU2Vzc2lvbi5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ291dFN1Y2Nlc3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgZnVuY3Rpb24gb25TdWNjZXNzZnVsTG9naW4ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgICAgIFNlc3Npb24uY3JlYXRlKGRhdGEuaWQsIGRhdGEudXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoQVVUSF9FVkVOVFMubG9naW5TdWNjZXNzKTtcbiAgICAgICAgICAgIHJldHVybiBkYXRhLnVzZXI7XG4gICAgICAgIH07XG5cbiAgICB9KTtcblxuICAgIGFwcC5zZXJ2aWNlKCdTZXNzaW9uJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIEFVVEhfRVZFTlRTKSB7XG5cbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYuZGVzdHJveSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi5kZXN0cm95KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuY3JlYXRlID0gZnVuY3Rpb24gKHNlc3Npb25JZCwgdXNlcikge1xuICAgICAgICAgICAgdGhpcy5pZCA9IHNlc3Npb25JZDtcbiAgICAgICAgICAgIHRoaXMudXNlciA9IHVzZXI7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5pZCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xuICAgICAgICB9O1xuXG4gICAgfSk7XG5cbn0pKCk7XG4iLCIndXNlIHN0cmljdCc7XG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyXG4gICAgXHQuc3RhdGUoJ2hvbWUnLCB7XG5cdCAgICAgICAgdXJsOiAnLycsXG5cdCAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9ob21lL2hvbWUuaHRtbCcsXG5cdCAgICB9KTtcbn0pO1xuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdsb2dpbicsIHtcbiAgICAgICAgdXJsOiAnL2xvZ2luJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9sb2dpbi9sb2dpbi5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0xvZ2luQ3RybCdcbiAgICB9KTtcblxufSk7XG5cbmFwcC5jb250cm9sbGVyKCdMb2dpbkN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCBBdXRoU2VydmljZSwgJHN0YXRlKSB7XG5cbiAgICAkc2NvcGUubG9naW4gPSB7fTtcbiAgICAkc2NvcGUuZXJyb3IgPSBudWxsO1xuXG4gICAgJHNjb3BlLnNlbmRMb2dpbiA9IGZ1bmN0aW9uIChsb2dpbkluZm8pIHtcblxuICAgICAgICAkc2NvcGUuZXJyb3IgPSBudWxsO1xuXG4gICAgICAgIEF1dGhTZXJ2aWNlLmxvZ2luKGxvZ2luSW5mbykudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc3RhdGUuZ28oJ2hvbWUnKTtcbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLmVycm9yID0gJ0ludmFsaWQgbG9naW4gY3JlZGVudGlhbHMuJztcbiAgICAgICAgfSk7XG5cbiAgICB9O1xuXG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgJHN0YXRlUHJvdmlkZXJcbiAgICAgICAgLnN0YXRlKCdtZW1iZXJzT25seScsIHtcbiAgICAgICAgICAgIHVybDogJy9tZW1iZXJzLWFyZWEnLFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9tZW1iZXJzLW9ubHkvbWVtYmVycy1vbmx5Lmh0bWwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogJ01lbWJlckNvbnRyb2xsZXInLFxuICAgICAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICAgICAgICAgIG9yZGVyOiBmdW5jdGlvbihDYXJ0RmFjdG9yeSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gQ2FydEZhY3RvcnkuZ2V0Q3VycmVudFVzZXIoKVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgdXNlcjogZnVuY3Rpb24oQXV0aFNlcnZpY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBUaGUgZm9sbG93aW5nIGRhdGEuYXV0aGVudGljYXRlIGlzIHJlYWQgYnkgYW4gZXZlbnQgbGlzdGVuZXIgdGhhdCBjb250cm9scyBhY2Nlc3MgdG8gdGhpcyBzdGF0ZS4gUmVmZXIgdG8gYXBwLmpzLlxuICAgICAgICAgICAgZGF0YTogeyAgICAgICAgICBcbiAgICAgICAgICAgICAgICBhdXRoZW50aWNhdGU6IHRydWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLnN0YXRlKCdtZW1iZXJzT25seS5lZGl0Jywge1xuICAgICAgICAgICAgdXJsOiAnLzp1c2VySUQnLFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9tZW1iZXJzLW9ubHkvbWVtYmVycy1vbmx5LWVkaXQuaHRtbCdcbiAgICAgICAgfSlcbiAgICAgICAgLnN0YXRlKCdtZW1iZXJzT25seS5yZXZpZXcnLCB7XG4gICAgICAgICAgICB1cmw6ICcvOnByb2R1Y3RJRCcsXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL21lbWJlcnMtb25seS9tZW1iZXJzLW9ubHktcmV2aWV3Lmh0bWwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogJ01lbWJlckNvbnRyb2xsZXInXG4gICAgICAgIH0pIFxufSk7XG5cbmFwcC5jb250cm9sbGVyKCdNZW1iZXJDb250cm9sbGVyJywgZnVuY3Rpb24oJHNjb3BlLCAkaHR0cCwgb3JkZXIsIHVzZXIsICRzdGF0ZVBhcmFtcykge1xuICAgICBcbiAgJHNjb3BlLm9yZGVyID0gb3JkZXI7XG4gICRzY29wZS51c2VyID0gdXNlcjtcblxuICAkc2NvcGUuc2F2ZVVzZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICRodHRwLnB1dCgnL2FwaS91c2VycycsICRzY29wZS51c2VyKVxuICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9KVxuICB9XG5cbiAgaWYgKCRzdGF0ZVBhcmFtcy5wcm9kdWN0SUQpIHsgXG4gICAgJHNjb3BlLnN1Ym1pdFJldmlldyA9IGZ1bmN0aW9uIChyZXZpZXcpIHtcbiAgICAgICAgcmV2aWV3LnByb2R1Y3RfaWQgPSAkc3RhdGVQYXJhbXMucHJvZHVjdElEXG4gICAgICAgIHJldmlldy51c2VyX2lkID0gJHNjb3BlLnVzZXIuX2lkXG5cbiAgICAgICAgJGh0dHAucG9zdCgnL2FwaS9wcm9kdWN0cy8nICsgJHN0YXRlUGFyYW1zLnByb2R1Y3RJRCArICcvcmV2aWV3cycsIHJldmlldylcbiAgICAgICAgICAudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3N1Y2Nlc3NmdWxseSBzYXZlZCByZXZpZXcnLCByZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgfTtcbiAgICBcbn0pO1xuXG5cblxuYXBwLmZpbHRlcignb3JkZXJTdGF0dXMnLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgICAgaWYgKGlucHV0ID09PSBmYWxzZSkge1xuICAgICAgICAgICAgcmV0dXJuIFwiSW4gUHJvZ3Jlc3NcIlxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIFwiQ29tcGxldGVkXCJcbiAgICAgICAgfVxuICAgIH1cbn0pXG4iLCIndXNlIHN0cmljdCc7XG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cdCRzdGF0ZVByb3ZpZGVyXG5cdFx0LnN0YXRlKCdvcmRlck1ndCcsIHtcblx0XHRcdHVybDogJy9vcmRlck1hbmFnZW1lbnQnLFxuXHRcdFx0dGVtcGxhdGVVcmw6ICdqcy9vcmRlci1tYW5hZ2VtZW50L29yZGVyLW1hbmFnZW1lbnQuaHRtbCcsXG5cdFx0XHRjb250cm9sbGVyOiAnT3JkZXJNYW5hZ2VtZW50Q29udHJvbGxlcicsXG5cdFx0XHRyZXNvbHZlOiB7XG5cdFx0XHRcdG9yZGVyczogZnVuY3Rpb24oT3JkZXJzKSB7XG5cdFx0XHRcdFx0cmV0dXJuIE9yZGVycy5nZXRBbGxPcmRlcnMoKVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRkZWxldGVPcmRlcjogZnVuY3Rpb24gKE9yZGVycykge1xuXHRcdFx0XHRcdHJldHVybiBPcmRlcnMuZGVsZXRlT3JkZXI7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9KVxuXHRcdC5zdGF0ZSgnb3JkZXJNZ3QuZWRpdCcsIHtcblx0XHRcdHVybDogJy86b3JkZXJJZCcsXG5cdFx0XHR0ZW1wbGF0ZVVybDogJ2pzL29yZGVyLW1hbmFnZW1lbnQvb3JkZXItbWFuYWdlbWVudC1lZGl0Lmh0bWwnLFxuXHRcdFx0Y29udHJvbGxlcjogJ09yZGVyTWFuYWdlbWVudENvbnRyb2xsZXInXG5cdFx0fSlcbn0pO1xuXG5hcHAuY29udHJvbGxlcignT3JkZXJNYW5hZ2VtZW50Q29udHJvbGxlcicsIGZ1bmN0aW9uKCRzY29wZSwgQXV0aFNlcnZpY2UsICRzdGF0ZVBhcmFtcywgb3JkZXJzLCBkZWxldGVPcmRlciwgT3JkZXJzKSB7XG5cdFx0JHNjb3BlLm9yZGVycyA9IG9yZGVycztcblxuXHRcdGlmICgkc3RhdGVQYXJhbXMub3JkZXJJZCkge1xuXHRcdFx0T3JkZXJzLmdldE9yZGVyKCRzdGF0ZVBhcmFtcy5vcmRlcklkKVxuXHRcdFx0XHQudGhlbihmdW5jdGlvbiAob3JkZXIpIHtcblx0XHRcdFx0XHQkc2NvcGUub3JkZXJJdGVtID0gb3JkZXI7XG5cdFx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHQkc2NvcGUuZGVsZXRlT3JkZXIgPSBmdW5jdGlvbihvcmRlcklEKSB7XG5cblx0XHRcdC8vIERlbGV0ZSB0aGUgb3JkZXIgZnJvbSB0aGUgZGF0YWJhc2Vcblx0XHRcdGRlbGV0ZU9yZGVyKG9yZGVySUQpXG5cdFx0XHRcblx0XHRcdCRzY29wZS5vcmRlcnMuZm9yRWFjaChmdW5jdGlvbiAob3JkZXIsIGlkeCkge1xuXHRcdFx0XHRpZiAob3JkZXIuX2lkID09PSBvcmRlcklEKSB7XG5cdFx0XHRcdFx0cmV0dXJuICRzY29wZS5vcmRlcnMuc3BsaWNlKGlkeCwgMSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdFx0fTtcblxuXHRcdCRzY29wZS5zYXZlT3JkZXIgPSBmdW5jdGlvbigpIHtcblx0XHRcdE9yZGVycy5zYXZlT3JkZXIoJHNjb3BlLm9yZGVySXRlbSk7XG5cdFx0fTtcbn0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlclxuXHQgICAgLnN0YXRlKCdwcm9kdWN0TWd0Jywge1xuXHQgICAgICAgIHVybDogJy9wcm9kdWN0TWFuYWdlbWVudC8nLFxuXHQgICAgICAgIHRlbXBsYXRlVXJsOiAnanMvcHJvZHVjdC1tYW5hZ2VtZW50L3Byb2R1Y3QtbWFuYWdlbWVudC5odG1sJyxcblx0ICAgICAgICBjb250cm9sbGVyOiAnUHJvZHVjdE1hbmFnZW1lbnRDb250cm9sbGVyJ1xuXHQgICAgfSkgIFxuXHQgICAgLnN0YXRlKCdwcm9kdWN0TWd0LmVkaXQnLCB7XG5cdCAgICBcdHVybDogJy86cHJvZHVjdElEJyxcblx0ICAgIFx0dGVtcGxhdGVVcmw6ICdqcy9wcm9kdWN0LW1hbmFnZW1lbnQvcHJvZHVjdC1tYW5hZ2VtZW50LWVkaXQuaHRtbCcsXG5cdCAgICBcdGNvbnRyb2xsZXI6ICdQcm9kdWN0TWFuYWdlbWVudENvbnRyb2xsZXInXG5cdCAgICB9KVxufSk7XG5cbmFwcC5jb250cm9sbGVyKCdQcm9kdWN0TWFuYWdlbWVudENvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCAkc3RhdGVQYXJhbXMsICRodHRwLCBQcm9kdWN0RmFjdG9yeSkgeyBcblxuXHRQcm9kdWN0RmFjdG9yeS5wcm9kdWN0cygpLnRoZW4oZnVuY3Rpb24ocHJvZHVjdCkge1xuXHRcdFx0JHNjb3BlLnByb2R1Y3RzID0gcHJvZHVjdDtcblx0fSlcblx0XG5cblx0aWYgKCRzdGF0ZVBhcmFtcy5wcm9kdWN0SUQpIHtcblx0XHRQcm9kdWN0RmFjdG9yeS5wcm9kdWN0SXRlbSgkc3RhdGVQYXJhbXMucHJvZHVjdElEKS50aGVuKGZ1bmN0aW9uKGl0ZW0pIHtcblx0XHRcdCRzY29wZS5wcm9kdWN0SXRlbSA9IGl0ZW07XG5cdFx0fSk7XHRcblx0fVxuXG5cdCRzY29wZS5zYXZlUHJvZHVjdCA9IGZ1bmN0aW9uKCkge1xuXHRcdFByb2R1Y3RGYWN0b3J5LnNhdmVQcm9kdWN0KCRzY29wZS5wcm9kdWN0SXRlbSlcblx0fTtcblxuXHQkc2NvcGUucmVtb3ZlUHJvZHVjdCA9IGZ1bmN0aW9uKHByb2R1Y3QpIHtcblx0XHQkc2NvcGUucHJvZHVjdHMuZm9yRWFjaCggZnVuY3Rpb24oc2NvcGVQcm9kdWN0KSB7XG5cdFx0XHRpZiAocHJvZHVjdC5faWQgPT09IHNjb3BlUHJvZHVjdC5faWQgKSB7XG5cdFx0XHRcdHZhciBpbmRleCA9ICRzY29wZS5wcm9kdWN0cy5pbmRleE9mKHNjb3BlUHJvZHVjdCk7XG5cdFx0XHRcdHJldHVybiAkc2NvcGUucHJvZHVjdHMuc3BsaWNlKGluZGV4LCAxKTtcblx0XHRcdH1cblx0XHR9KTtcblx0XHRQcm9kdWN0RmFjdG9yeS5yZW1vdmVQcm9kdWN0KHByb2R1Y3QuX2lkKVxuXHR9XG5cbn0pXG4iLCJhcHAuZmFjdG9yeSgnUHJvZHVjdEZhY3RvcnknLCBmdW5jdGlvbiAoJGh0dHApIHtcblxuXHRyZXR1cm4ge1xuXG5cdFx0cHJvZHVjdHM6IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuICRodHRwLmdldCgnL2FwaS9wcm9kdWN0cycpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgIFx0XHRcdFx0cmV0dXJuIHJlc3BvbnNlLmRhdGE7XG4gICAgICAgIFx0XHR9KTtcdFxuXHRcdH0sXG5cblx0XHRwcm9kdWN0Q2F0ZWdvcnk6IGZ1bmN0aW9uKGNhdGVnb3J5KSB7XG5cdFx0XHRyZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL2NhdGVnb3JpZXMvJyArIGNhdGVnb3J5KS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuXHRcdFx0XHRyZXR1cm4gcmVzcG9uc2UuZGF0YTtcblx0XHRcdH0pXG5cdFx0fSxcblxuXHRcdHByb2R1Y3RSZXZpZXdzOiBmdW5jdGlvbihpZCkge1xuXHRcdFx0cmV0dXJuICRodHRwLmdldCgnL2FwaS9wcm9kdWN0cy8nICsgaWQgKyAnL3Jldmlld3MnKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHJlc3BvbnNlLmRhdGFcblx0XHRcdFx0fSk7XG5cdFx0fSxcblxuXHRcdHByb2R1Y3RJdGVtOiBmdW5jdGlvbihpZCkge1xuXHRcdFx0cmV0dXJuICRodHRwLmdldCgnL2FwaS9wcm9kdWN0cy8nICsgaWQpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gcmVzcG9uc2UuZGF0YTtcblx0XHRcdFx0XHR9KTtcblx0XHR9LFxuXG5cdFx0Y3JlYXRlT3JkZXI6IGZ1bmN0aW9uKGlkKSB7XG5cdFx0XHRyZXR1cm4gJGh0dHAucG9zdCgnL2FwaS9wcm9kdWN0cy8nICsgaWQpO1xuXHRcdH0sXG5cblx0XHRzYXZlUHJvZHVjdDogZnVuY3Rpb24oaXRlbSkge1xuXHRcdFx0cmV0dXJuICRodHRwLnB1dCgnL2FwaS9wcm9kdWN0cycsIGl0ZW0pXG5cdFx0fSxcblxuXHRcdHJlbW92ZVByb2R1Y3Q6IGZ1bmN0aW9uKGlkKSB7XG5cdFx0XHRyZXR1cm4gJGh0dHAuZGVsZXRlKCcvYXBpL3Byb2R1Y3RzLycgKyBpZClcblx0XHR9LFxuXG5cdFx0Z2V0QnJhbmRzOiBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiAkaHR0cC5nZXQoJy9hcGkvY2F0ZWdvcmllcy8nKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuXHRcdFx0XHRyZXR1cm4gcmVzcG9uc2UuZGF0YTtcblx0XHRcdH0pXG5cdFx0fSxcblxuXHRcdHN1Ym1pdFJldmlldzogZnVuY3Rpb24ocHJvZHVjdElELCByZXZpZXcpIHtcblx0XHRcdHJldHVybiAkaHR0cC5wb3N0KCcvYXBpL3Byb2R1Y3RzLycgKyBwcm9kdWN0SUQgKyAnL3Jldmlld3MnLCByZXZpZXcpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG5cdFx0XHRcdHJldHVybiByZXNwb25zZS5kYXRhO1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdH1cblxuXG59KSIsIid1c2Ugc3RyaWN0JztcbmFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXJcblx0ICAgIC5zdGF0ZSgncHJvZHVjdHMnLCB7XG5cdCAgICAgICAgdXJsOiAnL3Byb2R1Y3RzJyxcblx0ICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL3Byb2R1Y3RzL3Byb2R1Y3RzLmh0bWwnLFxuXHQgICAgICAgIGNvbnRyb2xsZXI6ICdQcm9kdWN0c0NvbnRyb2xsZXInXG5cdCAgICB9KVxuXHQgICAgLnN0YXRlKCdwcm9kdWN0cy5pdGVtJywge1xuXHQgICAgXHR1cmw6ICcvOnByb2R1Y3RJRCcsXG5cdCAgICBcdHRlbXBsYXRlVXJsOiAnanMvcHJvZHVjdHMvcHJvZHVjdEl0ZW0uaHRtbCcsXG5cdCAgICBcdGNvbnRyb2xsZXI6ICdQcm9kdWN0c0NvbnRyb2xsZXInXG5cdCAgICB9KVxuXHRcdC5zdGF0ZSgncHJvZHVjdHMuY2F0ZWdvcmllcycsIHtcblx0ICAgIFx0dXJsOiAnLzpwcm9kdWN0Q2F0ZWdvcnknLFxuXHQgICAgXHR0ZW1wbGF0ZVVybDogJ2pzL3Byb2R1Y3RzL3Byb2R1Y3RDYXRlZ29yeS5odG1sJyxcblx0ICAgIFx0Y29udHJvbGxlcjogJ1Byb2R1Y3RzQ29udHJvbGxlcidcblx0ICAgIH0pXG5cdCAgICAgICAgXG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ1Byb2R1Y3RzQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsICRzdGF0ZVBhcmFtcywgUHJvZHVjdEZhY3RvcnkpIHsgXG5cblx0JHNjb3BlLmN1cnJlbnRDYXRlZ29yeTtcblx0JHNjb3BlLmdlbmRlcnMgPSBbJ1dvbWVuJywgJ01lbiddO1xuXHQkc2NvcGUuc2xpZGVzID0gW107XG5cblx0UHJvZHVjdEZhY3RvcnkuZ2V0QnJhbmRzKCkudGhlbihmdW5jdGlvbihicmFuZHMpIHtcblx0XHQkc2NvcGUuYnJhbmRzID0gYnJhbmRzO1xuXHR9KTtcblxuICAgXHRpZiAoJHN0YXRlUGFyYW1zLnByb2R1Y3RDYXRlZ29yeSkge1xuXHRcdFByb2R1Y3RGYWN0b3J5LnByb2R1Y3RDYXRlZ29yeSgkc3RhdGVQYXJhbXMucHJvZHVjdENhdGVnb3J5KS50aGVuKGZ1bmN0aW9uKGNhdGVnb3J5KSB7XG5cdFx0XHQkc2NvcGUucHJvZHVjdENhdGVnb3J5ID0gY2F0ZWdvcnk7XG5cdFx0XHQkc2NvcGUuY3VycmVudENhdGVnb3J5ID0gJHN0YXRlUGFyYW1zLnByb2R1Y3RDYXRlZ29yeTtcblx0XHR9KVxuXHR9XG5cdFxuXHRpZiAoJHN0YXRlUGFyYW1zLnByb2R1Y3RJRCkge1xuXHRcdFByb2R1Y3RGYWN0b3J5LnByb2R1Y3RSZXZpZXdzKCRzdGF0ZVBhcmFtcy5wcm9kdWN0SUQpLnRoZW4oZnVuY3Rpb24ocmV2aWV3cykge1xuXHRcdFx0JHNjb3BlLnByb2R1Y3RSZXZpZXdzID0gcmV2aWV3cztcblx0XHR9KTtcblxuXHRcdFByb2R1Y3RGYWN0b3J5LnByb2R1Y3RJdGVtKCRzdGF0ZVBhcmFtcy5wcm9kdWN0SUQpLnRoZW4oZnVuY3Rpb24oaXRlbSkge1xuXHRcdFx0JHNjb3BlLnByb2R1Y3RJdGVtID0gaXRlbTtcblxuXHRcdFx0JHNjb3BlLnNsaWRlcyA9IFtdO1xuXHRcdFx0XG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8ICRzY29wZS5wcm9kdWN0SXRlbS5pbWFnZVVSTC5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHQkc2NvcGUuc2xpZGVzLnB1c2goe1xuXHRcdFx0XHQgIFx0aW1hZ2U6ICRzY29wZS5wcm9kdWN0SXRlbS5pbWFnZVVSTFtpXVxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9KTtcdFx0XG5cdH07XG5cblx0JHNjb3BlLmNyZWF0ZU9yZGVyID0gZnVuY3Rpb24oaWQpIHtcblx0XHRQcm9kdWN0RmFjdG9yeS5jcmVhdGVPcmRlcihpZCk7XG5cdH1cblxuXHQkc2NvcGUub3V0T2ZTdG9jayA9IGZ1bmN0aW9uKHN0b2NrKSB7XG5cdFx0aWYgKHN0b2NrID4gMCkge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdH1cblxuXHQkc2NvcGUucmV2aWV3SXRlbSA9IHtcblx0ICAgICAgdXNlcl9pZDogbnVsbCxcblx0ICAgICAgcHJvZHVjdF9pZDogJHN0YXRlUGFyYW1zLnByb2R1Y3RJRCxcblx0ICAgICAgc3RhcnM6IDAsXG5cdCAgICAgIHJldmlldzogJydcblx0ICB9O1xuXG5cdCRzY29wZS5zaG93UmV2aWV3Rm9ybSA9IGZhbHNlO1xuXG5cdCRzY29wZS4kd2F0Y2goJ3Nob3dSZXZpZXdGb3JtJywgZnVuY3Rpb24oKXtcblx0ICAgICRzY29wZS5hZGRSZXZpZXdCdXR0b25UZXh0ID0gJHNjb3BlLnNob3dSZXZpZXdGb3JtID8gJ0hpZGUgRm9ybScgOiAnQWRkIFJldmlldyc7XG5cdH0pXG5cblx0JHNjb3BlLnN1Ym1pdFJldmlldyA9IGZ1bmN0aW9uIChyZXZpZXcpIHtcblxuXHQgIFx0UHJvZHVjdEZhY3Rvcnkuc3VibWl0UmV2aWV3KCRzdGF0ZVBhcmFtcy5wcm9kdWN0SUQsIHJldmlldykudGhlbihmdW5jdGlvbihyZXZpZXcpIHtcblx0ICBcdFx0Y29uc29sZS5sb2coJ1JldmlldyBzdWJtaXR0ZWQgLSAnLCByZXZpZXcpO1xuXHQgIFx0fSk7XG5cblx0ICAgICRzY29wZS5yZXZpZXdJdGVtID0ge1xuXHQgICAgICAgIHVzZXJfaWQ6IG51bGwsXG5cdCAgICAgICAgcHJvZHVjdF9pZDogJHN0YXRlUGFyYW1zLnByb2R1Y3RJRCxcblx0ICAgICAgICBzdGFyczogMCxcblx0ICAgICAgICByZXZpZXc6ICcnXG5cdCAgICB9O1xuXG5cdCAgICAkc2NvcGUuc2hvd1Jldmlld0Zvcm0gPSBmYWxzZTtcblx0fTtcbn0pO1xuXG5cblxuXG4iLCJhcHAuZmFjdG9yeSgnU2VhcmNoRmFjdG9yeScsIGZ1bmN0aW9uICgkaHR0cCkge1xuXG4gICAgcmV0dXJuIHtcblxuICAgICAgICBzZWFyY2hQcm9kdWN0czogZnVuY3Rpb24gKHBhcmFtcykge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICB1cmw6ICcvYXBpL3NlYXJjaCcsXG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgICAgICBwYXJhbXM6IHBhcmFtc1xuICAgICAgICAgICAgfSkudGhlbihmdW5jdGlvbihyZXMpe1xuICAgICAgICAgICAgICAgIHJldHVybiByZXMuZGF0YTtcbiAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZXJyO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0QnJhbmRzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCdhcGkvY2F0ZWdvcmllcycpLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5kYXRhO1xuICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgIHJldHVybiBlcnI7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG59KTsiLCIndXNlIHN0cmljdCc7XG5cbi8vVGhlIENvbmZpZyBiZWxvdyBkZWZpbmVzIHRoZSAvc2VhcmNoIHN0YXRlLCB3aGljaCB3aWxsXG4vL2FsbG93IHRoZSB1c2VyIHRvIHNlYXJjaCBmb3IgcHJvZHVjdHMuXG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKXtcbiAgICAkc3RhdGVQcm92aWRlclxuICAgICAgICAuc3RhdGUoJ3NlYXJjaCcsIHtcbiAgICAgICAgICAgIHVybDogJy9zZWFyY2g/OnBhcmFtJyxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnanMvc2VhcmNoL3NlYXJjaC5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdTZWFyY2hDb250cm9sbGVyJ1xuICAgICAgICB9KTtcbn0pO1xuXG5cbmFwcC5jb250cm9sbGVyKCdTZWFyY2hDb250cm9sbGVyJywgZnVuY3Rpb24oJHNjb3BlLCAkc3RhdGVQYXJhbXMsIFNlYXJjaEZhY3RvcnkpIHtcblx0JHNjb3BlLmJyYW5kcyA9IFtdO1xuICAgICRzY29wZS5wYXJhbU9iaiA9IHt9O1xuICAgICRzY29wZS5zZWFyY2hSZXN1bHRzID0gW107XG5cbiAgICAkc2NvcGUubWluUHJpY2VSYW5nZXMgPSBbICAgXG4gICAgICAgIHt0ZXh0OickMCcsIHZhbHVlOiAnJ30sXG4gICAgICAgIHt0ZXh0OickNTAnLCB2YWx1ZTogNTAuMDB9LFxuICAgICAgICB7dGV4dDonJDEwMCcsIHZhbHVlOiAxMDAuMDB9LFxuICAgICAgICB7dGV4dDonJDE1MCcsIHZhbHVlOiAxNTAuMDB9XG4gICAgXTtcblxuICAgICRzY29wZS5tYXhQcmljZVJhbmdlcyA9IFtcbiAgICAgICAge3RleHQ6JyQ1MCcsIHZhbHVlOiA1MC4wMH0sXG4gICAgICAgIHt0ZXh0OickMTAwJywgdmFsdWU6IDEwMC4wMH0sXG4gICAgICAgIHt0ZXh0OickMTUwJywgdmFsdWU6IDE1MC4wMH0sXG4gICAgICAgIHt0ZXh0OickMjAwIGFuZCBvdmVyJywgdmFsdWU6ICcnfVxuICAgIF07XG5cbiAgICBmdW5jdGlvbiBzZXRQYXJhbU9iaigpIHtcbiAgICAgICAgJHNjb3BlLnBhcmFtT2JqID0geyBcbiAgICAgICAgICAgIHRpdGxlOiAnJyxcbiAgICAgICAgICAgIGJyYW5kczogW10sXG4gICAgICAgICAgICBnZW5kZXI6ICcnLFxuICAgICAgICAgICAgcHJpY2VSYW5nZToge21pbjogJycsIG1heDogJyd9LFxuICAgICAgICAgICAgYXZnU3RhcnM6ICcnIFxuICAgICAgICB9O1xuICAgIH07XG5cbiAgICAkc2NvcGUuZ2V0UGFuZWxEYXRhID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIFNlYXJjaEZhY3RvcnkuZ2V0QnJhbmRzKCkudGhlbihmdW5jdGlvbihicmFuZHMpIHtcbiAgICAgICAgICAgICRzY29wZS5icmFuZHMgPSBicmFuZHM7XG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICAgcmV0dXJuIGVycjtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgICRzY29wZS5pbml0aWFsaXplU2VhcmNoID0gZnVuY3Rpb24oKSB7XG4gICAgXHRTZWFyY2hGYWN0b3J5LnNlYXJjaFByb2R1Y3RzKCRzY29wZS5wYXJhbU9iaikudGhlbihmdW5jdGlvbihwcm9kdWN0cykge1xuICAgIFx0XHQkc2NvcGUuc2VhcmNoUmVzdWx0cyA9IHByb2R1Y3RzO1xuICAgICAgICAgICAgY29uc29sZS5sb2cocHJvZHVjdHMpO1xuICAgIFx0fSkuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgICAgICByZXR1cm4gZXJyO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLnRvZ2dsZVNlbGVjdGlvbiA9IGZ1bmN0aW9uIChicmFuZCkge1xuICAgICAgICB2YXIgaWR4ID0gJHNjb3BlLnBhcmFtT2JqLmJyYW5kcy5pbmRleE9mKGJyYW5kKTtcblxuICAgICAgICBpZiAoaWR4ID4gLTEpIHtcbiAgICAgICAgICAkc2NvcGUucGFyYW1PYmouYnJhbmRzLnNwbGljZShpZHgsIDEpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICRzY29wZS5wYXJhbU9iai5icmFuZHMucHVzaChicmFuZCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgJHNjb3BlLnJlc2V0UGFyYW1zID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHNldFBhcmFtT2JqKCk7XG4gICAgICAgICRzY29wZS5zZWFyY2hSZXN1bHRzID0ge307XG4gICAgfTtcblxuICAgIHNldFBhcmFtT2JqKCk7XG4gICAgJHNjb3BlLmdldFBhbmVsRGF0YSgpO1xuXG4gICAgaWYgKCRzdGF0ZVBhcmFtcy5wYXJhbSkge1xuICAgICAgICAkc2NvcGUucGFyYW1PYmoudGl0bGUgPSAkc3RhdGVQYXJhbXMucGFyYW07XG4gICAgICAgICRzY29wZS5pbml0aWFsaXplU2VhcmNoKCk7XG4gICAgfVxufSk7IiwiYXBwLmZhY3RvcnkoJ1NpZ25VcEZhY3RvcnknLCBmdW5jdGlvbiAoJGh0dHApIHtcblxuICAgIHJldHVybiB7XG5cbiAgICAgICAgc2lnbnVwTmV3VXNlcjogZnVuY3Rpb24gKHNpZ251cE9iamVjdCkge1xuICAgICAgICAgICAgcmV0dXJuICAkaHR0cC5wb3N0KCcvYXBpL3VzZXJzJywgc2lnbnVwT2JqZWN0KVxuICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBlcnI7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICB9O1xuXG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcil7XG4gICAgJHN0YXRlUHJvdmlkZXJcbiAgICAgICAgLnN0YXRlKCdzaWdudXAnLCB7XG4gICAgICAgICAgICB1cmw6ICcvc2lnbnVwJyxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnanMvc2lnbnVwL3NpZ251cC5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdTaWduVXBDdHJsJ1xuICAgICAgICB9KTtcbn0pO1xuXG5hcHAuY29udHJvbGxlcignU2lnblVwQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsIEF1dGhTZXJ2aWNlLCAkc3RhdGUsIFNpZ25VcEZhY3RvcnkpIHtcblxuICAgICRzY29wZS5lcnJvciA9IG51bGw7XG4gICAgJHNjb3BlLnNpZ251cCA9IHt9O1xuXG4gICAgJHNjb3BlLnNlbmRTaWdudXAgPSBmdW5jdGlvbiAoc2lnbnVwKSB7XG4gICAgICAgICRzY29wZS5lcnJvciA9IG51bGw7XG5cbiAgICAgICAgU2lnblVwRmFjdG9yeS5zaWdudXBOZXdVc2VyKHNpZ251cClcblx0ICAgICAgICAudGhlbihmdW5jdGlvbih1c2VyKSB7XG5cdCAgICAgICAgXHQkc3RhdGUuZ28oJ2hvbWUnKTtcblx0ICAgICAgICBcdHJldHVybiBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKTtcblx0ICAgICAgICB9KVxuXHQgICAgICAgIC5jYXRjaChmdW5jdGlvbihlcnIpIHtcblx0ICAgICAgICBcdCRzY29wZS5lcnJvciA9ICdTaWduIHVwIGZvcm0gbm90IGNvbXBsZXRlZC9maWxsZWQgY29ycmVjdGx5ISc7XG5cdCAgICAgICAgXHRjb25zb2xlLmVycm9yKGVycik7XG5cdCAgICAgICAgfSlcbiAgICB9O1xuXG59KTsiLCIndXNlIHN0cmljdCc7XG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyXG5cdCAgICAuc3RhdGUoJ3VzZXJNZ3QnLCB7XG5cdCAgICAgICAgdXJsOiAnL3VzZXJNYW5hZ2VtZW50Jyxcblx0ICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL3VzZXItbWFuYWdlbWVudC91c2VyLW1hbmFnZW1lbnQuaHRtbCcsXG5cdCAgICAgICAgY29udHJvbGxlcjogJ1VzZXJNYW5hZ2VtZW50Q29udHJvbGxlcidcblx0ICAgIH0pICBcblx0ICAgIC5zdGF0ZSgndXNlck1ndC5lZGl0Jywge1xuXHQgICAgXHR1cmw6ICcvOnVzZXJJRCcsXG5cdCAgICBcdHRlbXBsYXRlVXJsOiAnanMvdXNlci1tYW5hZ2VtZW50L3VzZXItbWFuYWdlbWVudC1lZGl0Lmh0bWwnLFxuXHQgICAgXHRjb250cm9sbGVyOiAnVXNlck1hbmFnZW1lbnRDb250cm9sbGVyJ1xuXHQgICAgfSlcbn0pO1xuXG5hcHAuY29udHJvbGxlcignVXNlck1hbmFnZW1lbnRDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgJHN0YXRlUGFyYW1zLCAkaHR0cCkgeyBcblxuXHQkaHR0cC5nZXQoJy9hcGkvdXNlcnMnKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICRzY29wZS51c2VycyA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgIH0pXHRcblxuXHRpZiAoISEkc3RhdGVQYXJhbXMudXNlcklEKSB7XG5cdFx0ICRodHRwLmdldCgnL2FwaS91c2Vycy8nICsgJHN0YXRlUGFyYW1zLnVzZXJJRClcblx0XHRcdC50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuXHRcdFx0XHQkc2NvcGUudXNlckl0ZW0gPSByZXNwb25zZS5kYXRhO1xuXHRcdH0pXG5cdH1cblxuXHQvLyB0aGlzIGZ1bmN0aW9uIGlzIHVzZWQgd2hlbiBzYXZpbmcgZWRpdHMgdG8gZXhpc3RpbmcgdXNlcnMgLU5DIDUvMi8xNVxuXHQkc2NvcGUuc2F2ZVVzZXIgPSBmdW5jdGlvbigpIHtcblx0XHQkaHR0cC5wdXQoJy9hcGkvdXNlcnMnLCAkc2NvcGUudXNlckl0ZW0pXG5cdFx0XHQudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcblx0XHRcdFx0Y29uc29sZS5sb2cocmVzcG9uc2UuZGF0YSk7XG5cdFx0XHR9KVxuXHR9XG5cblx0Ly8gcmVtb3ZlcyBhIHVzZXIgLU5DIDUvMi8xNVxuXHQkc2NvcGUucmVtb3ZlVXNlciA9IGZ1bmN0aW9uKHVzZXIpIHtcblx0XHQkc2NvcGUudXNlcnMuZm9yRWFjaCggZnVuY3Rpb24oc2NvcGVVc2VyKSB7XG5cdFx0XHRpZiAodXNlci5faWQgPT09IHNjb3BlVXNlci5faWQgKSB7XG5cdFx0XHRcdHZhciBpbmRleCA9ICRzY29wZS51c2Vycy5pbmRleE9mKHNjb3BlVXNlcik7XG5cdFx0XHRcdHJldHVybiAkc2NvcGUudXNlcnMuc3BsaWNlKGluZGV4LCAxKTtcblx0XHRcdH1cblx0XHR9KTtcblx0XHRcblx0XHQkaHR0cC5kZWxldGUoJy9hcGkvdXNlcnMvJyArIHVzZXIuX2lkKVxuXHRcdFx0LnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKHJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0fSlcblx0fTtcblxufSlcbiIsIid1c2Ugc3RyaWN0JztcbmFwcC5mYWN0b3J5KCdSYW5kb21HcmVldGluZ3MnLCBmdW5jdGlvbiAoKSB7XG5cbiAgICB2YXIgZ2V0UmFuZG9tRnJvbUFycmF5ID0gZnVuY3Rpb24gKGFycikge1xuICAgICAgICByZXR1cm4gYXJyW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGFyci5sZW5ndGgpXTtcbiAgICB9O1xuXG4gICAgdmFyIGdyZWV0aW5ncyA9IFtcbiAgICAgICAgJ0hlbGxvLCB3b3JsZCEnLFxuICAgICAgICAnQXQgbG9uZyBsYXN0LCBJIGxpdmUhJyxcbiAgICAgICAgJ0hlbGxvLCBzaW1wbGUgaHVtYW4uJyxcbiAgICAgICAgJ1doYXQgYSBiZWF1dGlmdWwgZGF5IScsXG4gICAgICAgICdJXFwnbSBsaWtlIGFueSBvdGhlciBwcm9qZWN0LCBleGNlcHQgdGhhdCBJIGFtIHlvdXJzLiA6KScsXG4gICAgICAgICdUaGlzIGVtcHR5IHN0cmluZyBpcyBmb3IgTGluZHNheSBMZXZpbmUuJ1xuICAgIF07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBncmVldGluZ3M6IGdyZWV0aW5ncyxcbiAgICAgICAgZ2V0UmFuZG9tR3JlZXRpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBnZXRSYW5kb21Gcm9tQXJyYXkoZ3JlZXRpbmdzKTtcbiAgICAgICAgfVxuICAgIH07XG5cbn0pOyIsIid1c2Ugc3RyaWN0JztcbiIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmZhY3RvcnkoJ09yZGVycycsIGZ1bmN0aW9uIChBdXRoU2VydmljZSwgJGh0dHApIHtcblxuXHQvLyBnZXQgYWxsIG9yZGVycyBieSBhZG1pblxuICAgIHZhciBnZXRBbGxPcmRlcnMgPSBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpLnRoZW4oZnVuY3Rpb24oZGF0YSkge1xuXHRcdFx0dmFyIHVybCA9ICcvYXBpL3VzZXJzLycgKyBkYXRhLl9pZCArICcvYWxsT3JkZXJzJztcblx0ICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KHVybClcblx0XHR9KVxuXHRcdC50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuXHQgICAgXHRyZXR1cm4gcmVzcG9uc2UuZGF0YTtcblx0XHR9KVxuICAgIH1cblxuXHQvLyBkZWxldGUgdXJsOiAvYXBpL3VzZXJzL191c2VySURfL29yZGVycy9fb3JkZXJJZF8vZGVsZXRlXG5cdHZhciBkZWxldGVPcmRlciA9IGZ1bmN0aW9uKG9yZGVySWQpIHtcblx0XHRyZXR1cm4gQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKClcblx0XHRcdC50aGVuKGZ1bmN0aW9uIChkYXRhKSB7XG5cdFx0XHRcdHZhciB1cmwgPSAnL2FwaS91c2Vycy8nICsgZGF0YS5faWQgKyAnL29yZGVycy8nICsgb3JkZXJJZCArICcvZGVsZXRlJ1xuXHRcdFx0XHRyZXR1cm4gJGh0dHAuZGVsZXRlKHVybClcblx0XHRcdH0pXG5cdFx0XHQudGhlbihmdW5jdGlvbiAocmVzKSB7XG5cdFx0XHRcdHJldHVybiByZXMuZGF0YVxuXHRcdFx0fSlcblx0XHRcdC5jYXRjaCAoZnVuY3Rpb24gKGVycikge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhlcnIpXG5cdFx0XHRcdHJldHVybiBlcnJcblx0XHRcdH0pXG5cdH07XG5cblx0dmFyIGdldE9yZGVyID0gZnVuY3Rpb24ob3JkZXJJZCkge1xuXHRcdHJldHVybiBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKVxuXHRcdFx0LnRoZW4oZnVuY3Rpb24gKGRhdGEpIHtcblx0XHRcdFx0dmFyIHVybCA9ICcvYXBpL3VzZXJzLycgKyBkYXRhLl9pZCArICcvb3JkZXJzLycgKyBvcmRlcklkO1xuXHRcdFx0XHRyZXR1cm4gJGh0dHAuZ2V0KHVybClcblx0XHRcdH0pXG5cdFx0XHQudGhlbiAoZnVuY3Rpb24gKHJlcykge1xuXHRcdFx0XHRyZXR1cm4gcmVzLmRhdGFcblx0XHRcdH0pXG5cdFx0XHQuY2F0Y2ggKGZ1bmN0aW9uIChlcnIpIHtcblx0XHRcdFx0Y29uc29sZS5sb2coZXJyKVxuXHRcdFx0XHRyZXR1cm4gZXJyXG5cdFx0XHR9KVxuXHR9O1xuXG5cdHZhciBzYXZlT3JkZXIgPSBmdW5jdGlvbiAob3JkZXIpIHtcblx0XHRyZXR1cm4gQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKClcblx0XHRcdC50aGVuKGZ1bmN0aW9uIChkYXRhKSB7XG5cdFx0XHRcdHZhciB1cmwgPSAnL2FwaS91c2Vycy8nICsgZGF0YS5faWQgKyAnL29yZGVycy8nICsgb3JkZXIuX2lkO1xuXHRcdFx0XHRjb25zb2xlLmxvZyhvcmRlcik7XG5cdFx0XHRcdHJldHVybiAkaHR0cC5wdXQodXJsLCBvcmRlcik7XG5cdFx0XHR9KVxuXHR9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBnZXRBbGxPcmRlcnM6IGdldEFsbE9yZGVycyxcblx0XHRkZWxldGVPcmRlcjogZGVsZXRlT3JkZXIsXG5cdFx0Z2V0T3JkZXI6IGdldE9yZGVyLFxuXHRcdHNhdmVPcmRlcjogc2F2ZU9yZGVyXG4gICAgfVxufSlcbiIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmZhY3RvcnkoJ1VzZXJzJywgZnVuY3Rpb24gKEF1dGhTZXJ2aWNlLCAkaHR0cCkge1xuXG4gICAgdmFyIGdldEFsbFVzZXJzID0gZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdHZhciB1cmwgPSAnL2FwaS91c2Vycy8nO1xuXHRcdFx0Y29uc29sZS5sb2codXJsKTtcblx0ICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KHVybClcblx0XHR9KVxuXHRcdC50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuXHQgICAgXHRyZXR1cm4gcmVzcG9uc2UuZGF0YTtcblx0XHR9KVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGdldEFsbFVzZXJzOiBnZXRBbGxVc2Vyc1xuICAgIH07XG59KTtcbiIsIi8vIHVuYWJsZSB0byBnZXQgdGhpcyB3b3JrIGF0IHRoZSBtb21lbnQgLSBOQyA0LzI2LzIwMTVcblxuJ3VzZSBzdHJpY3QnO1xuYXBwLmRpcmVjdGl2ZSgnaGlwc2hhZGVzTG9nbycsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL2hpcHNoYWRlcy1sb2dvL2hpcHNoYWRlcy1sb2dvLmh0bWwnXG4gICAgfTtcbn0pOyIsIid1c2Ugc3RyaWN0JztcbmFwcC5kaXJlY3RpdmUoJ25hdmJhcicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBdXRoU2VydmljZSwgQVVUSF9FVkVOVFMsICRzdGF0ZSkge1xuXG4gICAgLy8gTWFrZSBzdXJlIHRvIHJ1biBndWxwIHRocm91Z2hvdXQgZGV2LCBhbmQgY2hhbmdlIHRoZSBwcm9kdWN0cyBzdGF0ZVxuICAgIC8vIFdoZW4gcHJvZHVjdHMgYXJlIGF2YWlsYWJsZS5cblxuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9uYXZiYXIvbmF2YmFyLmh0bWwnLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUpIHtcbiAgICAgICAgICAgIHNjb3BlLml0ZW1zID0gW1xuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdIb21lJywgc3RhdGU6ICdob21lJyB9LFxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdQcm9kdWN0cycsIHN0YXRlOiAncHJvZHVjdHMnIH0sXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ0NhcnQnLCBzdGF0ZTogJ2NhcnQnfSxcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnVXNlciBTZXR0aW5ncycsIHN0YXRlOiAnbWVtYmVyc09ubHknLCBhdXRoOiB0cnVlfVxuICAgICAgICAgICAgXTtcbiAgICAgICAgICAgIHNjb3BlLmFkbWluSXRlbXMgPSBbXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ1Byb2R1Y3QgTWFuYWdlbWVudCcsIHN0YXRlOiAncHJvZHVjdE1ndCcsIGFkbWluOiB0cnVlfSxcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnT3JkZXIgTWFuYWdlbWVudCcsIHN0YXRlOiAnb3JkZXJNZ3QnLCBhZG1pbjogdHJ1ZX0sXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ1VzZXIgTWFuYWdlbWVudCcsIHN0YXRlOiAndXNlck1ndCcsIGFkbWluOiB0cnVlfVxuICAgICAgICAgICAgXTtcblxuICAgICAgICAgICAgc2NvcGUudXNlciA9IG51bGw7XG4gICAgICAgICAgICBzY29wZS5uYXZTZWFyY2hTdHJpbmcgPSBudWxsO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBzY29wZS5pc0xvZ2dlZEluID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKTtcbiAgICAgICAgICAgIH07XG5cblx0XHRcdHNjb3BlLmlzQWRtaW4gPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0cmV0dXJuIEF1dGhTZXJ2aWNlLmlzQWRtaW4oKTtcblx0XHRcdH07XG5cbiAgICAgICAgICAgIHNjb3BlLmxvZ291dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBBdXRoU2VydmljZS5sb2dvdXQoKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2hvbWUnKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHNjb3BlLnNlYXJjaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ3NlYXJjaCcsIHsgcGFyYW06IHNjb3BlLm5hdlNlYXJjaFN0cmluZyB9KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBzZXRVc2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgc2NvcGUudXNlciA9IHVzZXI7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB2YXIgcmVtb3ZlVXNlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBzY29wZS51c2VyID0gbnVsbDtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgc2V0VXNlcigpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MsIHNldFVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubG9nb3V0U3VjY2VzcywgcmVtb3ZlVXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgcmVtb3ZlVXNlcik7XG5cbiAgICAgICAgfVxuXG4gICAgfTtcblxufSk7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=