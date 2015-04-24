/**
 * Created by Max on 4/23/15.
 */
'use strict';
app.config(function ($stateProvider) {
    $stateProvider.state('products', {
        url: '/products',
        templateUrl: 'js/products/products.html'
    });
});

app.controller('ProductsCtrl', function($scope, GetProductsFactory){

    $scope.brand = [
        {label: 'Rayban'},
        {},
        {},
    ]


});