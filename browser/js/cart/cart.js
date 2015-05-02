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

    // $http.get('/api/users/5540243ce24891a73269cb17/orders/5540243ce24891a73269cb2b')
    //     .then(function(response) {
    //         $scope.orderData = response.data.product_ids;
    //         console.log($scope.orderData)
    //     });


    //console.log($http)

    var apiURL

    // temporary user workflow
    // get current user from cookie id
       $http.get('/api/users/currentuser/')
           .then(function(res) {
               if (res.data === 'undefined') {
                   console.log('nothing in cart')
               } else {
                   $scope.orderData = res.data[0].product_ids
                   $scope.theWholeThing = res.data[0]
                   //console.log($scope.theWholeThing)
               }
           });

    //DELETE /api/users/:userid/orders/:anorderid/products/:aproductID

    $scope.deleteProduct = function(productID) {

        $scope.orderData.forEach(function(elm, index) {
            if(elm._id === productID) {
                $scope.orderData.splice(index,1);
            }
        });
        $http.delete('/api/users/'+ $scope.theWholeThing.user_id + '/orders/' + $scope.theWholeThing._id + '/product_ids/' + productID)
            .then(function(deletedProduct){
                console.log($scope.orderData)
            })
    }

});