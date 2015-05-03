'use strict';
var app = require('express')();
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

router.get('/:id', function(req, res, next) {
	res.json(req.product)
});

// this route is receiving edits made to products -NC 5/2/15
router.put('/', function(req, res, next) {
	var editProduct = req.body;

	if(editProduct._id === undefined) {
		var newProduct = new Product(editProduct);
		newProduct.save()
		res.send("successfully saved")
	} else {
		Product.update({_id: editProduct._id}, { $set: editProduct }, function(err) {
			if (err) return handleError(err);
			res.send('successfully updated')
		})
	}
})



router.get('/:id/reviews', function(req, res, next) {
	req.product.getReviews()
		.then(function(data) {
		res.json(data);
	});
});

router.post('/:id/reviews', function(req, res, next) {
	// Reference schema for what is expected as the POST body.
	var reviewData = req.body;

	Review.create(reviewData, function (err, review) {
	    if (err) return next(err);
	    res.json(review);
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
	
	var cookieId = req.cookies['connect.sid'].match(/[a-zA-Z0-9]+/g)[1];

	User.find({email: cookieId + '@temp.com'}, function(err, data) {
		if (err) {
			return console.log(err);
		} else if (data.length === 0) {
			// creates temporary user and save to database
			var tempUser = new User({
				email: cookieId + '@temp.com',
				first_name: 'temp'
			});
			tempUser.save(function(err, tempUser) {
				if (err) return console.error(err);
				console.log('the temp user id is ', tempUser._id);
			});

			// creates new order for temp user 
			var newOrder = new Order ({
				product_ids: [req.params.id],
				user_id: tempUser._id
			})
			newOrder.save(function(err, newOrder) {
				if (err) return console.error(err);
			})
		} else {
			// adds an order to the temporary user's cart
			Order.find({user_id: data[0]._id}, function(err, order) {
				if (err) return console.log(err);								
				var newProduct = order[0].product_ids;
				newProduct.push(req.params.id);
				Order.update({user_id: data[0]._id}, {$set: {product_ids: newProduct}}).exec();
			});
		}
	})
});

module.exports = router;
