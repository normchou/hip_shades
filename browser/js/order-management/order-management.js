'use strict';

app.config(function ($stateProvider) {
	$stateProvider
		.state('orderMgt', {
			url: '/orderManagement',
			templateUrl: 'js/order-management/order-management.html',
			controller: 'OrderManagementController'
		});
});

app.controller('OrderManagementController', function($scope, AuthService, $stateParams, $http) {
	AuthService.getLoggedInUser().then(function(data) {
		var url = '/api/users/' + data._id + '/orders';
		$http.get(url).then(function (response) {
			console.log(response.data);
			$scope.orders = response.data;
		});
	})
});
