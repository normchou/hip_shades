'use strict';
app.config(function ($stateProvider) {
    $stateProvider
	    .state('products', {
	        url: '/products',
	        templateUrl: 'js/products/products.html',
	        controller: 'ProductsController'
	    })
	    .state('products.item', {
	    	url: '/:productID',
	    	templateUrl: 'js/products/productItem.html',
	    	controller: 'ProductsController'
	    })
		.state('products.category', {
	    	url: '/:productCategory',
	    	templateUrl: 'js/products/productCategory.html',
	    	controller: 'ProductsController'
	    })
	        
});


app.controller('ProductsController', function ($scope, $stateParams, GetProductsFactory) { 

		GetProductsFactory.getProducts()
			.then( function (productList) {
				$scope.products = productList;
			})

		GetProductsFactory.getSingleProduct()
			.then( function (productItem) {
				$scope.productItem = productItem;
			})

		GetProductsFactory.getProductByCategory()
			.then( function (productCategory) {
				$scope.productCategory = productCategory;
			})

		GetProductsFactory.getProductReviews()
			.then( function (productReviews) {
				$scope.productReviews = productReviews;
			})

})


