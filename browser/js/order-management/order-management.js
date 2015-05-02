'use strict';

app.config(function ($stateProvider) {
	$stateProvider
		.state('orderMgt', {
			url: '/orderManagement',
			templateUrl: 'js/order-management/order-management.html',
			controller: 'OrderManagementController',
			resolve: {
				orders: function(Orders) {
					return Orders.getAllOrders()
				}
			}
		})
		.state('orderMgt.edit', {
			url: '/:orderID',
			templateUrl: 'js/order-manangement/order-management-edit.html',
			controller: 'OrderManagementController'
		})
});

app.controller('OrderManagementController', function($scope, AuthService, $stateParams, $http, orders) {
		$scope.orders = orders;
});
