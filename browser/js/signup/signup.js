app.config(function ($stateProvider){
    $stateProvider
        .state('signup', {
            url: '/signup',
            templateUrl: 'js/signup/signup.html',
            controller: 'SignUpCtrl'
        });
});

app.controller('SignUpCtrl', function ($scope, AuthService, $state, SignUpFactory) {

    $scope.error = null;
    $scope.signup = {};

    $scope.sendSignup = function (signup) {
        $scope.error = null;

        SignUpFactory.signupNewUser(signup)
	        .then(function(user) {
	        	$state.go('products');
	        	return AuthService.getLoggedInUser();
	        })
	        .catch(function(err) {
	        	$scope.error = 'Sign up form not completed/filled correctly!';
	        	console.error(err);
	        })
    };

});