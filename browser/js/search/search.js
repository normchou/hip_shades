'use strict';

//The Config below defines the /search state, which will
//allow the user to search for products.

app.config(function ($stateProvider){
    $stateProvider
        .state('search', {
            url: '/search',
            templateUrl: 'js/search/search.html',
            controller: 'SearchController'
        });
});


app.controller('SearchController', function($scope, SearchFactory) {
	$scope.criteriaObject = {	
		title: "",
		description: "",
		price: 0,
		categories: []
	};

	$scope.searchResults;

    $scope.initializeSearch = function(criteriaObject) {
    	SearchFactory.searchProducts(criteriaObject).then(function(products) {
    		$scope.searchResults = products;
    	}).catch(function(err) {
            console.error(err);
            return err;
        });
    }


    $scope.initializeSearch(criteriaObject);
});