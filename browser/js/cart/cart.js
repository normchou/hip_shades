'use strict';

//The Config below defines the /cart state, which will
//show all products in the cart.

app.config(function ($stateProvider){
    $stateProvider
        .state('cart', {
            url: '/cart',
            templateUrl: 'js/cart/cart.html',
            controller: 'CartController'
        });
});

//app.controller('CartController', function($scope, ))

app.controller('CartController', function($scope, $http) {

    $http.get('/api/users/5540243ce24891a73269cb17/orders/5540243ce24891a73269cb2b')
        .then(function(response) {
            $scope.orderData = response.data.product_ids;
            console.log($scope.orderData)
        });

});