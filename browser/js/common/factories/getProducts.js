app.factory('GetProductsFactory', function ($http, $stateParams) {

    var getProducts = function () {
        return $http.get('/api/products')
            .then(function (response) {
                return response.data;
            })
    }

    var getSingleProduct = function () {
    	return $http.get('/api/products/' + $stateParams.productID)
    		.then(function (response) {
    			return response.data;
    		})
    }

    
    return {
        getProducts: getProducts,
        getSingleProduct: getSingleProduct
    };
})

