'use strict';
var router = require('express').Router();
var mongoose = require('mongoose')
var Product = mongoose.model('Product');

router.get('/', function(req, res, next) {
	Product.getAllCategories().then(function (data) {
		console.log(data);
		res.json(data);
	});
});

router.get('/:categoryName', function(req, res, next) {
	Product.getByCategory(req.params.categoryName)
		.then(function(data) {
			res.json(data);
		});
});

module.exports = router;
