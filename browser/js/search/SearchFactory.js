app.factory('SearchFactory', function ($http, $q) {

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

        getSearchPanelData: function () {
            var dataObj = {};

            var categories = $http.get('/api/categories');
            var brands = $http.get('api/brands');

            return $q.all([categories, brands]).then(function(resultsArray) {
                // dataObj.categories = resultsArray[0].data;
                // dataObj.brands = resultsArray[1].data;
                dataObj.brands = ['Oakley', 'Prada', 'Ray-ban'];
                dataObj.categories = ['Polarized', 'Glass', 'Polycarbonate'];
                return dataObj;
            }).catch(function(err) {
                console.error(err);
                return err;
            });
        }
    };
});