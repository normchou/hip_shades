'use strict';
var router = require('express').Router();
var mongoose = require('mongoose')
var Product = mongoose.model('Product');
var User = mongoose.model('User');
var Order = mongoose.model('Order');
var cookieParser = require('cookie-parser');

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



// Add to cart button - creates a temp user and order in the database
router.post('/:id', function(req, res, next) {
	console.log('this is the cookie id', req.cookies['connect.sid'])
	
	console.log('this is cookie json', cookieParser.JSONCookie(req.cookies))

	// User.find({email: 'req.cookies['connect.sid']'}, function ()

	// if(!req.cookies) {
		// creates temporary user
		var tempUser = new User({
			email: req.cookies['connect.sid'] + '@temp.com'
		})
		// saves the temporary user to the database
		tempUser.save(function(err, tempUser) {
			if (err) return console.error(err);
			console.log('the temp id is ', tempUser._id);
		})
	// }

	// creates order object
	var newOrder = new Order ({
		product_ids: [req.params.id],
	})
	// saves new order to the database
	newOrder.save(function(err, newOrder) {
		if (err) return console.error(err);
		console.log(newOrder);
	})
});

module.exports = router;
