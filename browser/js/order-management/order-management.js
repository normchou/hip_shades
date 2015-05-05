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
				},
				deleteOrder: function (Orders) {
					return Orders.deleteOrder;
				}
			}
		})
		.state('orderMgt.edit', {
			url: '/:orderID',
			templateUrl: 'js/order-manangement/order-management-edit.html',
			controller: 'OrderManagementController'
		})
});

app.controller('OrderManagementController', function($scope, AuthService, $stateParams, $http, orders, deleteOrder) {
		$scope.orders = orders;

		$scope.deleteOrder = function(orderID) {
			// Delete the order from the database
			deleteOrder(orderID)
			
			$scope.orders.forEach(function (order, idx) {
				if (order._id === orderID) {
					return $scope.orders.splice(idx, 1);
				}
			})
		}
});
