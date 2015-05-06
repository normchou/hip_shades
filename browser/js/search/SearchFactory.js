app.factory('SearchFactory', function ($http) {

    return {

        searchProducts: function () {
            return $http.get('/api/products/search').then(function(res){
                return res.data;
            }).catch(function(err) {
                console.error(err);
                return err;
            });
        }

    };

});