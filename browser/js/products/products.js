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
		.state('products.categories', {
	    	url: '/:productCategory',
	    	templateUrl: 'js/products/productCategory.html',
	    	controller: 'ProductsController'
	    })
	        
});


app.controller('ProductsController', function ($scope, $stateParams, $http) { 

		// request to get list of products
		$http.get('/api/products')
            .then(function (response) {
                $scope.products = response.data;
            })	

        // request to get single product
        $http.get('/api/products/' + $stateParams.productID)
    		.then(function (response) {
    			$scope.productItem = response.data;
    		})

		// request to get list of categories
		$http.get('api/categories/' + $stateParams.productCategory)
    		.then(function (response) {
    			$scope.productCategory = response.data;
    		})

    	// request to get product reviews
		$http.get('api/products/' + $stateParams.productID + '/reviews')
    		.then(function (response) {
    			$scope.productReviews = response.data
    		})


})


