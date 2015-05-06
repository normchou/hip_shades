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
$scope.quantities = [1,2,3,4,5,6,7,8,9];

    $scope.initializeCart = function() {
        CartFactory.getCurrentUser().then(function(currentOrder) {

            if (currentOrder === 'undefined') {
                console.log('nothing in cart');
            } else {
                $scope.defineCartScope(currentOrder);
            }
        }).catch(function(err) {
            console.error(err);
            return err;
        });
    }

    $scope.deleteProduct = function(product) {
      //DELETE /api/users/:userid/orders/:anorderid/products/:aproductID
        CartFactory.deleteProductInCart($scope.currentOrder.user_id, $scope.currentOrder._id, product.id._id).then(function(newCurrentOrder) {
            $scope.defineCartScope(newCurrentOrder);
        }).catch(function(err) {
            console.error(err);
            return err;
        });
    }

    $scope.saveQuantity = function() { 
        CartFactory.saveOrder($scope.currentOrder.user_id, $scope.currentOrder._id, $scope.currentOrder).then(function(newCurrentOrder) {
            $scope.defineCartScope(newCurrentOrder);
        }).catch(function(err) {
            console.error(err);
            return err;
        });  
    }

    $scope.defineCartScope = function (currentOrder) {
        $scope.orderData = currentOrder.products;
        $scope.currentOrder = currentOrder;
        $scope.priceSum = CartFactory.priceSum(currentOrder);
        $scope.itemCount = CartFactory.itemCount(currentOrder);
        $scope.salesTax = $scope.priceSum > 0 ? 28.50 : 0;
        $scope.shippingHandling = $scope.priceSum > 0 ? 20.00 : 0;
        $scope.totalOrder = $scope.priceSum + $scope.salesTax + $scope.shippingHandling;
    }

    $scope.initializeCart();
});