app.factory('SearchFactory', function ($http) {

    return {

        searchProducts: function (params) {
            return $http({
                url: '/api/search',
                method: 'GET',
                params: params
            }).then(function(res){
                return res.data;
            }).catch(function(err) {
                console.error(err);
                return err;
            });
        },

        getBrands: function () {
            return $http.get('api/categories').then(function(res) {
                return res.data;
            }).catch(function(err) {
                console.error(err);
                return err;
            });
        }
    };
});