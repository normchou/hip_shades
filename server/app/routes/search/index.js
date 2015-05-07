'use strict';
var router = require('express').Router();
var mongoose = require('mongoose')
var Product = mongoose.model('Product');
var User = mongoose.model('User');
var Order = mongoose.model('Order');
var Review = mongoose.model('Review');

router.get('/', function(req, res, next) {
	Product.find({}, function(err, data) {
		res.json(data);
	});
});

module.exports = router;
