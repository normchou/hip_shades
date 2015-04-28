'use strict';
var router = require('express').Router();
var mongoose = require('mongoose')
var Product = mongoose.model('Product');
var User = mongoose.model('User');
var Order = mongoose.model('Order');

router.get('/', function(req, res, next) {
	Product.find({}, function(err, data) {
		res.json(data);
	});
});

router.get('/:id', function(req, res, next) {
	res.json(req.product)
});

router.get('/:id/reviews', function(req, res, next) {
	req.product.getReviews()
		.then(function(data) {
		res.json(data);
	});
});

router.param('id', function(req, res, next, id) {
	Product.findById(id, function(err, product) {
		if(err) return next(err)
		if(!product) return res.status(404).end()
		req.product = product
		next()
	})
})


// Temporary
// Add to cart button - create order in database
router.post('/:id', function(req, res, next) {

	// creates order object
	var newOrder = new Order ({
		product_ids: [req.params.id],
	})

	// saves new order to the database
	newOrder.save(function(err, newOrder) {
		if (err) return console.error(err);
		console.dir(newOrder);
	})
});

module.exports = router;
