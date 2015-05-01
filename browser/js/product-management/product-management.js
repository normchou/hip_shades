'use strict';
app.config(function ($stateProvider) {
    $stateProvider
	    .state('productMgt', {
	        url: '/productManagement',
	        templateUrl: 'js/product-management/product-management.html',
	        controller: 'ProductManagementController'
	    })  
});

app.controller('ProductManagementController', function ($scope, $stateParams, $http) { 

	$http.get('/api/products')
        .then(function (response) {
            $scope.products = response.data;
        })	

})
