'use strict';
var router = require('express').Router();
var mongoose = require('mongoose')
var Order = mongoose.model('Order');
var Utils = require('../common/');
var isLoggedIn = Utils.isLoggedIn;
var isAdmin = Utils.isAdmin;

// this route is /api/users/user_mongo_id/orders
router.get('/', function(req, res, next) {
	if (!isAdmin(req, res, next))
		res.status(403).send('How did you get here you hacker? You shall not see any more!');

	var userId = req.user._id;

	Order.find({user_id: userId}, function(err, data) {
		res.json(data);
	});

});

// don't need this route <- Yes we do, please do not remove.
router.get('/:id', function(req, res, next) {
	req.order.populate('products', function(err, populatedOrder){
		res.json(populatedOrder)
	});
});

router.post('/:id',function(req, res, next) {
	for (var i = 0; i < req.order.products.length; i++) {
		req.order.products[i].id = req.body.products[i].id._id;
		req.order.products[i].quantity = req.body.products[i].quantity;
	};

	req.order.save(function(err, order) {
		if(err) return next(err);
		order.populate('products.id', function(err, populatedOrder){
			if(err) return next(err);
			console.log("Pop - ", populatedOrder);
			res.json(populatedOrder)
		});
	});
});

//DELETE /api/orders/:anorderid/products/:aproductID
router.delete('/:id/products/:product_id',function(req, res, next) {
	for (var i = 0; i < req.order.products.length; i++) {
		if (req.order.products[i].id.equals(req.params.product_id)) {
			req.order.products.splice(i, 1);
		}
	};

	req.order.save(function(err, order) {
		if(err) return next(err);
		order.populate('products.id', function(err, populatedOrder){
			if(err) return next(err);
			res.json(populatedOrder)
		});
	});
});

// DELETE /api/users/_userID_/order/_orderID_/delete
router.delete('/:id/delete', function (req, res, next) {
	if (!isAdmin)
		res.status(403).send('Thou shalt not delete an order you _underprivileged_ creature!')

	Order.findOneAndRemove({'_id': req.order._id}, function (err, order) {
		console.log('deleting order with id = ', order._id);
		if (err) next(err);
	});
});

router.param('id', function(req, res, next, id) {
	Order.findOne({'_id': id}, function(err, order) {
		if(err) return next(err)
		if(!order) return res.status(404).end()
		req.order = order 
		next()
	});
});

// router.post('/', function(req, res, next) {
// 	// 1. find if there is an existing cart
// 	// 2. if there is, add to the cart
// 	// 3. if there isn't, add to a new cart
// 	// 4. redirect to same page
// })

module.exports = router;
