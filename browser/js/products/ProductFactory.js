app.factory('ProductFactory', function ($http) {

	return {

		products: function() {
			return $http.get('/api/products').then(function (response) {
     				return response.data;
        		});	
		},

		productCategory: function(category) {
			return $http.get('/api/categories/' + category).then(function (response) {
							return response.data;
						})
		},

		productReviews: function(id) {
			return $http.get('/api/products/' + id + '/reviews').then(function (response) {
						return response.data
				});
		},

		productItem: function(id) {
			return $http.get('/api/products/' + id).then(function (response) {
						return response.data;
					});
		},

		createOrder: function(id) {
			return $http.post('/api/products/' + id);
		},

		saveProduct: function(item) {
			return $http.put('/api/products', item)
		},

		removeProduct: function(id) {
			return $http.delete('/api/products/' + id)
		}

	}


})