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

app.controller('ProductsController', function ($scope, $stateParams, ProductFactory) { 

	$scope.genders = ['women', 'men'];
	$scope.brands = ['Oakley', 'Prada', 'Ray-Ban'];

   	if ($stateParams.productCategory) {
		ProductFactory.productCategory($stateParams.productCategory).then(function(category) {
			$scope.productCategory = category;
		})
	}
	
	if ($stateParams.productID) {
		ProductFactory.productReviews($stateParams.productID).then(function(reviews) {
			$scope.productReviews = reviews;
		})
		ProductFactory.productItem($stateParams.productID).then(function(item) {
			$scope.productItem = item;
		});		
	};

	$scope.createOrder = function(id) {
		ProductFactory.createOrder(id);
	}

	$scope.outOfStock = function(stock) {
		if (stock > 0) {
			return true;
		} else {
			return false;
		}
	}

	$scope.showCarousel = true;

	$scope.hideCarousel = function() {
		$scope.showCarousel = false;
		consoel.log('....', $scope.showCarousel)
	}

});




