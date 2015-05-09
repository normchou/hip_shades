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

	$scope.currentCategory;
	$scope.genders = ['Women', 'Men'];
	$scope.slides = [];

	ProductFactory.getBrands().then(function(brands) {
		$scope.brands = brands;
	});

   	if ($stateParams.productCategory) {
		ProductFactory.productCategory($stateParams.productCategory).then(function(category) {
			$scope.productCategory = category;
			$scope.currentCategory = $stateParams.productCategory;
		})
	}
	
	if ($stateParams.productID) {
		ProductFactory.productReviews($stateParams.productID).then(function(reviews) {
			$scope.productReviews = reviews;
		});

		ProductFactory.productItem($stateParams.productID).then(function(item) {
			$scope.productItem = item;

			$scope.slides = [];
			
			for (var i = 0; i < $scope.productItem.imageURL.length; i++) {
				$scope.slides.push({
				  	image: $scope.productItem.imageURL[i]
				});
			}
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

	  	ProductFactory.submitReview($stateParams.productID, review).then(function(review) {
	  		console.log('Review submitted - ', review);
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




