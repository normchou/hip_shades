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

		//averageStars() is async, so we have to use q.all
		products.forEach(function(elem) {
			promises.push(elem.averageStars());
		});

		return q.all(promises);
	}).then(function(products) {
		
		if (queryObjects.secondQueryObj.avgStars) {
			products = products.filter(function(elem) {
				return elem.avgStars >= queryObjects.secondQueryObj.avgStars;
			});
		}

		res.json(products);
	}, function(err) {
		res.json(err);
	});
});

module.exports = router;
