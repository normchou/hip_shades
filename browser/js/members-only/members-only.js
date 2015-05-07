app.config(function ($stateProvider) {

    $stateProvider.state('membersOnly', {
        url: '/members-area',
        templateUrl: 'js/members-only/members-only.html',
        controller: 'MemberController',
        resolve: {
            orders: function(Orders) {
                return Orders.getAllOrders()
            }
        },
        // The following data.authenticate is read by an event listener
        // that controls access to this state. Refer to app.js.
        data: {
            authenticate: true
        }
    });

});


app.controller('MemberController', function($scope, $http, SecretStash, orders, AuthService) {
     
     SecretStash.getStash().then(function (stash) {
                $scope.stash = stash;
            });
     
     $scope.order = orders


    console.log('calling controller', AuthService.getLoggedInUser().then(function(data) {return data}))

     // $http.get('/session', function(err, data) {
     //    if (err) return console.log(err);
     //    console.log('this is the data', data)
     // }
     // authservice for localhost:1337/session



})

app.factory('SecretStash', function ($http) {

    var getStash = function () {
        return $http.get('/api/members/secret-stash').then(function (response) {
            return response.data;
        });
    };

    return {
        getStash: getStash
    };

});