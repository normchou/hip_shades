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

	// request to get list of products - NC 4/26/2015
	$http.get('/api/products')
        .then(function (response) {
            $scope.products = response.data;
        })	

   	if($stateParams.productCategory) {
		// request to get list of categories - NC 4/26/2015
		$http.get('/api/categories/' + $stateParams.productCategory)
			.then(function (response) {
				$scope.productCategory = response.data;
			})
	}

	if($stateParams.productID) {
		// request to get product reviews - NC 4/26/2015
		$http.get('/api/products/' + $stateParams.productID + '/reviews')
			.then(function (response) {
				$scope.productReviews = response.data
			})
	    // request to get single product - NC 4/26/2015
	    $http.get('/api/products/' + $stateParams.productID)
			.then(function (response) {
				$scope.productItem = response.data;
			})
	}

	// function to add an order to database - NC 4/26/2015
	$scope.createOrder = function(id) {
		$http.post('/api/products/' + id)
			.then(function (response) {
				console.log('successfully posted', response.data)
			})
	}

})


