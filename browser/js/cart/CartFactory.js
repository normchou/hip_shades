app.factory('CartFactory', function ($http) {

    return {

        getCurrentUser: function () {
            // temporary user workflow
            // get current user from cookie id
            return $http.get('/api/users/currentuser/').then(function(res){
                if (res.data)
                    return res.data[0];
                throw err;
            }).catch(function(err) {
                console.error(err);
                return err;
            });
        },

        deleteProductInCart: function (userID, orderID, productID) {
            return $http.delete('/api/users/'+ userID + '/orders/' + orderID + '/products/' + productID)
                .then(function(res) {
                    return res.data;
                }).catch(function(err) {
                    console.error(err);
                    return err;
                });

        }

    };

});