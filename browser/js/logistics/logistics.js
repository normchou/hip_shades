app.config(function ($stateProvider){
    $stateProvider
        .state('logistics', {
            url: '/logistics',
            templateUrl: 'js/logistics/logistics.html',
            controller: 'LogisticsCtrl'
        });
});

app.controller('LogisticsCtrl', function ($scope, AuthService, $state, LogisticsFactory) {

    $scope.error = null;

    $scope.sendSignup = function (signup) {
        $scope.error = null;

        LogisticsFactory.signupNewUser('/api/users', signup)
	        .then(function(newUser) {
	        	$state.go('home');
	        	return AuthService.getLoggedInUser();
	        })
	        .catch(function(err) {
	        	$scope.error = 'Sign up form not completed/filled correctly!';
	        	console.error(err);
	        });
    };

});