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
            templateUrl: 'js/members-only/members-only-review.html'
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

$scope.reviewItem = {
          user_id: null,
          product_id: $stateParams.productID,
          stars: 0,
          review: ''
      };

      $scope.showReviewForm = false;

      $scope.$watch('showReviewForm', function(){
          $scope.addReviewButtonText = $scope.showReviewForm ? 'Hide Form' : 'Add Review';
      })

      $scope.submitReview = function (review) {

          $http.post('/api/products/' + $stateParams.productID + '/reviews', review)
            .then(function (response) {
                console.log(response.data);
            });

          $scope.reviewItem = {
              user_id: null,
              product_id: $stateParams.productID,
              stars: 0,
              review: ''
          };

          $scope.showReviewForm = false;
      };


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
