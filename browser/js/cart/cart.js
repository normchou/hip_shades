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

app.controller('CartController', function($scope, CartFactory) {
    // temporary user workflow
    // get current user from cookie id
    $scope.initializeCart = function() {
      CartFactory.getCurrentUser().then(function(currentUser) {
         if (currentUser === 'undefined') {
             console.log('nothing in cart');
         } else {
             $scope.orderData = currentUser.product_ids;
             $scope.currentUser = currentUser;
         }
      });
    }

    $scope.deleteProduct = function(productID) {
      //DELETE /api/users/:userid/orders/:anorderid/products/:aproductID
      CartFactory.deleteProductInCart($scope.currentUser.user_id, $scope.currentUser._id, productID).then(function(deletedProduct) {
        console.log("deleted product", deletedProduct);
        $scope.initializeCart();
      });
    }

    $scope.initializeCart();
});