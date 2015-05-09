'use strict';
var router = require('express').Router();
var mongoose = require('mongoose')
var Product = mongoose.model('Product');

router.get('/', function(req, res, next) {
	Product.getAllCategories().then(function (data) {
		res.json(data);
	});
});

router.get('/:category', function(req, res, next) {
	console.log(req.params.category);

	if (req.params.category === 'Men' || req.params.category === 'Women') {
		Product.getByGender(req.params.category.toLowerCase())
			.then(function(data) {
				res.json(data);
			});
	} else {
		Product.getByCategory(req.params.category)
			.then(function(data) {
				res.json(data);
			});
	}
});

module.exports = router;
