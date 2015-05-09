'use strict';

app.factory('Orders', function (AuthService, $http) {

	// get all orders by admin
    var getAllOrders = function () {
		return AuthService.getLoggedInUser().then(function(data) {
			var url = '/api/users/' + data._id + '/allOrders';
	        return $http.get(url)
		})
		.then(function (response) {
	    	return response.data;
		})
    }

	// delete url: /api/users/_userID_/orders/_orderId_/delete
	var deleteOrder = function(orderId) {
		return AuthService.getLoggedInUser()
			.then(function (data) {
				var url = '/api/users/' + data._id + '/orders/' + orderId + '/delete'
				return $http.delete(url)
			})
			.then(function (res) {
				return res.data
			})
			.catch (function (err) {
				console.log(err)
				return err
			})
	};

	var getOrder = function(orderId) {
		return AuthService.getLoggedInUser()
			.then(function (data) {
				var url = '/api/users/' + data._id + '/orders/' + orderId;
				return $http.get(url)
			})
			.then (function (res) {
				return res.data
			})
			.catch (function (err) {
				console.log(err)
				return err
			})
	};

	var saveOrder = function (order) {
		return AuthService.getLoggedInUser()
			.then(function (data) {
				var url = '/api/users/' + data._id + '/orders/' + order._id;
				console.log(order);
				return $http.put(url, order);
			})
	}

    return {
        getAllOrders: getAllOrders,
		deleteOrder: deleteOrder,
		getOrder: getOrder,
		saveOrder: saveOrder
    }
})
