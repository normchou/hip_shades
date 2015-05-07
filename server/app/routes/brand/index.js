'use strict';
var router = require('express').Router();
var mongoose = require('mongoose')
var Product = mongoose.model('Product');

router.get('/', function(req, res, next) {
	Product.getAllBrands().then(function (data) {
		res.json(data);
	});
});

router.get('/:brandName', function(req, res, next) {
	Product.getByBrand(req.params.brandName)
		.then(function(data) {
			res.json(data);
		});
});

module.exports = router;