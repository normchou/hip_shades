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
        .state('membersOnly.review', {
            url: '/:productID',
            templateUrl: 'js/members-only/members-only-review.html',
            controller: 'MemberController'
        }) 
});

app.controller('MemberController', function($scope, $http, order, user, $stateParams) {
     
  $scope.order = order;
  $scope.user = user;

  $scope.saveUser = function() {
      $http.put('/api/users', $scope.user)
          .then(function (response) {
              console.log(response.data);
          })
  }

  if ($stateParams.productID) { 
    $scope.submitReview = function (review) {
        review.product_id = $stateParams.productID
        review.user_id = $scope.user._id

        $http.post('/api/products/' + $stateParams.productID + '/reviews', review)
          .then(function (response) {
              console.log('successfully saved review', response.data);
          });
        };
  };
    
});



app.filter('orderStatus', function() {
    return function(input) {
        if (input === false) {
            return "In Cart"
        } else {
            return "Processing"
        }
    }
})

app.filter('deliverStatus', function() {
    return function(input) {
        if (input === false) {
            return "Shipped"
        } else {
            return "Delivered"
        }
    }
})