'use strict';

app.factory('Users', function (AuthService, $http) {

    var getAllUsers = function () {
		return AuthService.getLoggedInUser().then(function(data) {
			var url = '/api/users/';
			console.log(url);
	        return $http.get(url)
		})
		.then(function (response) {
	    	return response.data;
		})
    }

    return {
        getAllUsers: getAllUsers
    };
});
