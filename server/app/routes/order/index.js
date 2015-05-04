'use strict';
var router = require('express').Router();
var mongoose = require('mongoose')
var Order = mongoose.model('Order');


// this route is /api/users/user_mongo_id/orders
router.get('/', function(req, res, next) {
	var userId = req.baseUrl.split('/')[3]

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


router.param('id', function(req, res, next, id) {
	Order.findOne({'_id': id}, function(err, order) {
		if(err) return next(err)
		if(!order) return res.status(404).end()
		req.order = order 
		next()
	});
});

//DELETE /api/orders/:anorderid/products/:aproductID
router.delete('/:id/products/:product_id',function(req, res, next) {
	for (var i = 0; i < req.order.products.length; i++) {
		if (req.order.products[i].id.equals(req.params.product_id)) {
			req.order.products.splice(i, 1);
		}
	};

	Order.update({_id: req.order._id}, {$set: {products: req.order.products}}, function(err, data) {
		if(err) return next(err)
		res.json(data);
	});
});

// router.post('/', function(req, res, next) {
// 	// 1. find if there is an existing cart
// 	// 2. if there is, add to the cart
// 	// 3. if there isn't, add to a new cart
// 	// 4. redirect to same page
// })

module.exports = router;
