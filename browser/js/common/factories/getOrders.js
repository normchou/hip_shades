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

	// delete url: /api/users/_userID_/orders/_orderID_/delete
	var deleteOrder = function(orderID) {
		return AuthService.getLoggedInUser()
			.then(function (data) {
				var url = '/api/users/' + data._id + '/orders/' + orderID + '/delete'
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

    return {
        getAllOrders: getAllOrders,
		deleteOrder: deleteOrder
    }
})
