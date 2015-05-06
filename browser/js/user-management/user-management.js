'use strict';
app.config(function ($stateProvider) {
    $stateProvider
	    .state('userMgt', {
	        url: '/userManagement',
	        templateUrl: 'js/user-management/user-management.html',
	        controller: 'UserManagementController'
	    })  
	    .state('userMgt.edit', {
	    	url: '/:userID',
	    	templateUrl: 'js/user-management/user-management-edit.html',
	    	controller: 'UserManagementController'
	    })
});

app.controller('UserManagementController', function ($scope, $stateParams, $http) { 

	$http.get('/api/users')
        .then(function (response) {
            $scope.users = response.data;
        })	

	if (!!$stateParams.userID) {
		 $http.get('/api/users/' + $stateParams.userID)
			.then(function (response) {
				$scope.userItem = response.data;
		})
	}

	// this function is used when saving edits to existing users -NC 5/2/15
	$scope.saveUser = function() {
		$http.put('/api/users', $scope.userItem)
			.then(function (response) {
				console.log(response.data);
			})
	}

	// removes a user -NC 5/2/15
	$scope.removeUser = function(user) {
		$scope.users.forEach( function(scopeUser) {
			if (user._id === scopeUser._id ) {
				var index = $scope.users.indexOf(scopeUser);
				return $scope.users.splice(index, 1);
			}
		});
		
		$http.delete('/api/users/' + user._id)
			.then(function (response) {
				console.log(response.data);
			})
	};

})
