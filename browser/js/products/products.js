'use strict';
app.config(function ($stateProvider) {
    $stateProvider
	    .state('products', {
	        url: '/products',
	        templateUrl: 'js/products/products.html',
	        controller: 'ProductsController'
	    });
	    // .state('product.title', {
	    // 	url: '/:title',
	    // 	templateUrl: 'js/products/products.category.html',
	    // 	controller: 'ProductsController'
	    // });
});


app.controller('ProductsController', function ($scope, GetProductsFactory) { 

		GetProductsFactory.getProducts()
			.then( function (productList) {
					$scope.products = productList;
			})
})


