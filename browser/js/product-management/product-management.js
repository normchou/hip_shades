'use strict';
app.config(function ($stateProvider) {
    $stateProvider
	    .state('productMgt', {
	        url: '/productManagement',
	        templateUrl: 'js/product-management/product-management.html',
	        controller: 'ProductManagementController'
	    })  
	    .state('productMgt.edit', {
	    	url: '/:productID',
	    	templateUrl: 'js/product-management/product-management-edit.html',
	    	controller: 'ProductManagementController'
	    })
});

app.controller('ProductManagementController', function ($scope, $stateParams, $http) { 

	$http.get('/api/products')
        .then(function (response) {
            $scope.products = response.data;
            return $scope.products;
        })	

	if($stateParams.productID) {
	    $http.get('/api/products/' + $stateParams.productID)
			.then(function (response) {
				$scope.productItem = response.data;
			})
	}

	// this function is used when saving edits to existing products -NC 5/2/15
	$scope.saveProduct = function() {
		$http.put('/api/products', $scope.productItem)
			.then(function (response) {
				console.log(response.data);
			})
	}


})

