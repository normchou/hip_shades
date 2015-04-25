app.factory('GetProductsFactory', function ($http) {

    var getProducts = function () {
        return $http.get('/api/product')
            .then(function (response) {
                return response.data;
            })
    }


    
    return {
        getProducts: getProducts
    };
})

