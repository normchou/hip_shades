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
                var menIndex = res.data.indexOf('men');
                if (menIndex > -1)
                    res.data.splice(menIndex, 1);

                var womenIndex = res.data.indexOf('women');
                if (womenIndex > -1)
                    res.data.splice(womenIndex, 1);

                return res.data;
            }).catch(function(err) {
                console.error(err);
                return err;
            });
        }
    };
});