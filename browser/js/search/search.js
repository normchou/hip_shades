'use strict';

//The Config below defines the /search state, which will
//allow the user to search for products.

app.config(function ($stateProvider){
    $stateProvider
        .state('search', {
            url: '/search?:param',
            templateUrl: 'js/search/search.html',
            controller: 'SearchController'
        });
});


app.controller('SearchController', function($scope, $stateParams, SearchFactory) {
	$scope.panelOptions = { 
        categories: [], 
        brands: []
    };

    $scope.paramObj = {};

    $scope.searchResults = {};

    $scope.minPriceRanges = ['$0','$50','$100','$150'];
    $scope.maxPriceRanges = ['$50','$100','$150','$200 and over'];

    function setParamObj() {
        $scope.paramObj = { 
            keywords: '',
            categories: [],
            brands: [],
            gender: '',
            priceRange: {min: '$0', max: '$200 and over'},
            avgStars: '' 
        };
    }

    $scope.getPanelData = function() {
        SearchFactory.getSearchPanelData().then(function(data) {
            $scope.panelOptions.categories = data.categories;
            $scope.panelOptions.brands = data.brands;
        }).catch(function(err) {
            console.error(err);
            return err;
        });
    }

    $scope.initializeSearch = function() {
    	SearchFactory.searchProducts($scope.paramObj).then(function(products) {
    		$scope.searchResults = products;
    	}).catch(function(err) {
            console.error(err);
            return err;
        });
    }

    $scope.toggleSelection = function (array, brand) {
        var idx = array.indexOf(brand);

        if (idx > -1) {
          array.splice(idx, 1);
        } else {
          array.push(brand);
        }
    };

    $scope.resetParams = function() {
        setParamObj();
        $scope.searchResults = {};
    }

    setParamObj();
    $scope.getPanelData();
});