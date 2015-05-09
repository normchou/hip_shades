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
	$scope.brands = [];
    $scope.paramObj = {};
    $scope.searchResults = [];

    $scope.minPriceRanges = [   
        {text:'$0', value: ''},
        {text:'$50', value: 50.00},
        {text:'$100', value: 100.00},
        {text:'$150', value: 150.00}
    ];

    $scope.maxPriceRanges = [
        {text:'$50', value: 50.00},
        {text:'$100', value: 100.00},
        {text:'$150', value: 150.00},
        {text:'$200 and over', value: ''}
    ];

    function setParamObj() {
        $scope.paramObj = { 
            title: '',
            brands: [],
            gender: '',
            priceRange: {min: '', max: ''},
            avgStars: '' 
        };
    };

    $scope.getPanelData = function() {
        SearchFactory.getBrands().then(function(brands) {
            $scope.brands = brands;
        }).catch(function(err) {
            console.error(err);
            return err;
        });
    };

    $scope.initializeSearch = function() {
    	SearchFactory.searchProducts($scope.paramObj).then(function(products) {
    		$scope.searchResults = products;
            console.log(products);
    	}).catch(function(err) {
            console.error(err);
            return err;
        });
    };

    $scope.toggleSelection = function (brand) {
        var idx = $scope.paramObj.brands.indexOf(brand);

        if (idx > -1) {
          $scope.paramObj.brands.splice(idx, 1);
        } else {
          $scope.paramObj.brands.push(brand);
        }
    };

    $scope.resetParams = function() {
        setParamObj();
        $scope.searchResults = {};
    };

    setParamObj();
    $scope.getPanelData();

    if ($stateParams.param) {
        $scope.paramObj.title = $stateParams.param;
        $scope.initializeSearch();
    }
});