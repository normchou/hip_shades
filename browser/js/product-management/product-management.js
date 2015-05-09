'use strict';
app.config(function ($stateProvider) {
    $stateProvider
	    .state('productMgt', {
	        url: '/productManagement/',
	        templateUrl: 'js/product-management/product-management.html',
	        controller: 'ProductManagementController'
	    })  
	    .state('productMgt.edit', {
	    	url: '/:productID',
	    	templateUrl: 'js/product-management/product-management-edit.html',
	    	controller: 'ProductManagementController'
	    })
});

app.controller('ProductManagementController', function ($scope, $stateParams, $http, ProductFactory) { 

	ProductFactory.products().then(function(product) {
			$scope.products = product;
	})
	
	if ($stateParams.productID) {
		ProductFactory.productItem($stateParams.productID).then(function(item) {
			$scope.productItem = item;
		});	
	}

	$scope.saveProduct = function() {
		ProductFactory.saveProduct($scope.productItem)
	};

	$scope.removeProduct = function(product) {
		$scope.products.forEach( function(scopeProduct) {
			if (product._id === scopeProduct._id ) {
				var index = $scope.products.indexOf(scopeProduct);
				return $scope.products.splice(index, 1);
			}
		});
		ProductFactory.removeProduct(product._id)
	}

})
