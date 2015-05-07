app.config(function ($stateProvider) {

    $stateProvider
        .state('membersOnly', {
            url: '/members-area',
            templateUrl: 'js/members-only/members-only.html',
            controller: 'MemberController',
            resolve: {
                order: function(CartFactory) {
                    return CartFactory.getCurrentUser()
                },
                user: function(AuthService) {
                    return AuthService.getLoggedInUser();
                }
            },
            // The following data.authenticate is read by an event listener that controls access to this state. Refer to app.js.
            data: {          
                authenticate: true
            }
        })
        .state('membersOnly.edit', {
            url: '/:userID',
            templateUrl: 'js/members-only/members-only-edit.html'
        })
});

app.controller('MemberController', function($scope, order, user) {
     
    $scope.order = order;
    $scope.user = user;

});


app.filter('orderStatus', function() {
    return function(input) {
        if (input === false) {
            return "In Progress"
        } else {
            return "Completed"
        }
    }
})
