'use strict';

app.factory('ReviewFactory', function ($http) {

    return {
        addReview: function (review) {

            return $http.post('/reviews', review).then(function (response) {
                return response.data;
            });
        }
    };

});

app.directive('review', function(ReviewFactory){
    return {
        restrict: 'E',
        templateUrl: '/js/reviews/review.html',
        controller: 'ReviewController'
    };
});

app.controller('ReviewController', function ($scope, $stateParams, ReviewFactory) {

  $scope.reviewItem = {
            user_id: null,
            product_id: null,
            stars: 0,
            review: ''
        };

        $scope.max = 5;
        $scope.isReadonly = false;
        $scope.showReviewForm = false;

        $scope.$watch('showReviewForm', function(){
            $scope.addReviewButtonText = $scope.showReviewForm ? 'Hide Form' : 'Add Review';
        })

        $scope.ratingStates = [
          {stateOn: 'glyphicon-star', stateOff: 'glyphicon-star-empty'},
          {stateOn: 'glyphicon-star', stateOff: 'glyphicon-star-empty'},
          {stateOn: 'glyphicon-star', stateOff: 'glyphicon-star-empty'},
          {stateOn: 'glyphicon-star', stateOff: 'glyphicon-star-empty'},
          {stateOn: 'glyphicon-star', stateOff: 'glyphicon-star-empty'},
        ];

        $scope.hoveringOver = function(value) {
          $scope.overStar = value;

          if (value)
            $scope.starDescription = ["These suck", "I'll pass", "Good, but I've seen better", "Pretty rad shades", "Love them!"][value-1];
        };

        $scope.submitReview = function (review) {

          ReviewFactory.addReview(review).then(function (newReview) {
            console.log(newReview);

            $scope.reviewItem = {
                user_id: null,
                product_id: null,
                stars: 0,
                review: ''
            };

          });
        };

});