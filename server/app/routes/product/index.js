'use strict';
var router = require('express').Router();
var mongoose = require('mongoose')
var Product = mongoose.model('Product');
var User = mongoose.model('User');
var Order = mongoose.model('Order');
var Review = mongoose.model('Review');
var Utils = require('../common');
var needAdminPrivileges = Utils.needAdminPrivileges;
var needUserLoggedIn = Utils.needUserLoggedIn;

router.get('/', function(req, res, next) {
	Product.find({}, function(err, data) {
		res.json(data);
	});
});

router.get('/:id', function(req, res, next) {
	res.json(req.product)
});

// this route is receiving edits made to products -NC 5/2/15
router.put('/', needAdminPrivileges, function(req, res, next) {
	var editProduct = req.body;

	if(typeof editProduct._id === 'undefined') {
		var newProduct = new Product(editProduct);
		newProduct.save(function(err) {
			if (err) return handleError(err);
			res.send("successfully saved")
		});
	} else {
		Product.update({_id: editProduct._id}, { $set: editProduct }, function(err) {
			if (err) return handleError(err);
			res.send('successfully updated')
		})
	}
});


// route to remove a product -NC 5/2/15
router.delete('/:id', needAdminPrivileges, function(req, res, next) {

	Product.findOneAndRemove({_id: req.params.id}, function(err, product) {
		if(err) return console.log(err);
		console.log('removed this product', product)
	})

	res.send('successfully deleted')
})


router.get('/:id/reviews', function(req, res, next) {
	req.product.getReviews()
		.then(function(data) {
		res.json(data);
	});
});

router.post('/:id/reviews', needUserLoggedIn, function(req, res, next) {
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

router.post('/:id', function(req, res, next) {
// If the user is logged in, use the following logic
	if (typeof(req.user) !== "undefined") {
		Order.findOne({user_id: req.user._id, checked_out: false})
			.exec(function (err, order) {
				if (err) {
					return console.log(err);
				} 
// This user has not added a item into his/her cart
				else if (!order) { 
					var newOrder = new Order ({
						products: [{id: req.params.id, quantity: 1}],
						user_id: req.user._id
					});
					newOrder.save(function(err, newOrder) {
						if (err) return console.error(err);	
						res.json(newOrder);			
					});
				} 
// This user already has items in his/her cart, we just need to add a new item
				else { 
					return order.addProductToOrder(req.params.id);
				}
			})
// If the user is NOT logged in, use the following logic.
	} else {		
		var cookieId = req.cookies['connect.sid'].match(/[a-zA-Z0-9]+/g)[1];
		User.findOne({email: cookieId + '@temp.com'})
			.exec(function(err, user) {
				if (err) {
					return console.log(err);
				} 
// If the temp user is not a user in the database, create a user for him and save the product to his cart.
				else if (!user) {		
console.log('omg...')
					var tempUser = new User({
						email: cookieId + '@temp.com',
						first_name: 'temp'
					});
					tempUser.save(function(err, tempUser) {
						if (err) return console.error(err);
						var newOrder = new Order ({
							products: [{id: req.params.id, quantity: 1}],
							user_id: tempUser._id
						})
						newOrder.save(function(err, newOrder) {
							if (err) return next(err);
							res.json(newOrder);
						})
					});
				} 
// If the temp user is a user in the database, find the user and add the product to his cart.
				else {
					Order.findOne({user_id: user._id, checked_out: false}).exec().then(function(order) {
						if (order === null) {
							var newOrder = new Order ({
								products: [{id: req.params.id, quantity: 1}],
								user_id: user._id
							})
							return newOrder.save()
						}
						else {
							return order.addProductToOrder(req.params.id);
						}
					}).then(function(savedOrder) {
						res.json(savedOrder);
					}, function(err) {
						res.json(err);
					});
				}
				
			})
	}

});

module.exports = router;
