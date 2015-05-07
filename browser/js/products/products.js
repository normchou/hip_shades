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

app.controller('ProductsController', function ($scope, $stateParams, $http, ProductFactory) { 

	$scope.genders = ['women', 'men'];
	$scope.brands = ['Oakleys', 'Prada', 'Ray-Ban'];

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



	$scope.reviewItem = {
	      user_id: null,
	      product_id: $stateParams.productID,
	      stars: 0,
	      review: ''
	  };

	  $scope.showReviewForm = false;

	  $scope.$watch('showReviewForm', function(){
	      $scope.addReviewButtonText = $scope.showReviewForm ? 'Hide Form' : 'Add Review';
	  })

	  $scope.submitReview = function (review) {

	      $http.post('/api/products/' + $stateParams.productID + '/reviews', review)
	      	.then(function (response) {
	      		console.log(response.data);
	      	});

	      $scope.reviewItem = {
	          user_id: null,
	          product_id: $stateParams.productID,
	          stars: 0,
	          review: ''
	      };

	      $scope.showReviewForm = false;
	  };

});




