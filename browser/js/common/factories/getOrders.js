'use strict';

app.factory('Orders', function (AuthService, $http) {

    var getAllOrders = function () {
		return AuthService.getLoggedInUser().then(function(data) {
			var url = '/api/users/' + data._id + '/allOrders';
			console.log(url);
	        return $http.get(url)
		})
		.then(function (response) {
	    	return response.data;
		})
    }

    return {
        getAllOrders: getAllOrders
    };
});
