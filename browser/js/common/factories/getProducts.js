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

    var getProductByCategory = function () {
    	return $http.get('api/categories/' + $stateParams.productCategory)
    		.then(function (response) {
    			return response.data;
    		})
    }

    var getProductReviews = function () {
    	return $http.get('api/products/' + $stateParams.productID + '/reviews')
    		.then(function (response) {
    			return response.data
    		})
    }
    
    return {
        getProducts: getProducts,
        getSingleProduct: getSingleProduct,
        getProductByCategory: getProductByCategory,
        getProductReviews: getProductReviews
    };
})

