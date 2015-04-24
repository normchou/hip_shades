/**
 * Created by Max on 4/23/15.
 */

app.factory('GetProductsFactory', function($http){

    return {

        console.log('Hi');

        getProducts: function(product){

            var queryParams = {};



            return $http.get('/api/product',{
                params: queryParams
            }).then(function(response){
                return response.data;
            })
        }
    }
})
