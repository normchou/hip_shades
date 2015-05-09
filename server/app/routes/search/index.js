'use strict';
var router = require('express').Router();
var mongoose = require('mongoose')
var Product = mongoose.model('Product');
var User = mongoose.model('User');
var Order = mongoose.model('Order');
var Review = mongoose.model('Review');
var q = require('q');

router.get('/', function(req, res, next) {

	var queryObjects = Product.defineQueryObj(req.query);

	Product.find(queryObjects.initialQueryObj).exec().then(function(products) {
		var promises = [];

		//averageStars() is async
		products.forEach(function(elem) {
			promises.push(elem.averageStars());
		});

		return q.all(promises);
	}).then(function(products) {
		
		var filtered = products;

		if (queryObjects.secondQueryObj.avgStars) {
			filtered = filtered.filter(function(elem) {
				return elem.avgStars >= queryObjects.secondQueryObj.avgStars;
			});
		}

		if (queryObjects.secondQueryObj.gender) {
			filtered = filtered.filter(function(elem) {
				return elem.populatedDoc.categories.indexOf(queryObjects.secondQueryObj.gender) > 0;
			});
		}	

		res.json(filtered);
	}, function(err) {
		res.json(err);
	});
});

module.exports = router;
