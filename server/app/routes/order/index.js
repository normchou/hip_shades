'use strict';
var router = require('express').Router();
var mongoose = require('mongoose')
var Order = mongoose.model('Order');

// this route is /api/users/user_mongo_id/orders
router.get('/', function(req, res, next) {
	console.log('this is the req body', req.baseUrl)
	console.log('this is the cookie', req.cookies.name)

	var userId = req.baseUrl.split('/')[3]

	Order.find({user_id: userId}, function(err, data) {
		res.json(data);
	});

});

// don't need this route <- Yes we do, please do not remove.
router.get('/:id', function(req, res, next) {
	req.order.populate('product_ids', function(err, populatedOrder){
		res.json(populatedOrder)
	});
});


router.param('id', function(req, res, next, id) {
	Order.findOne({'_id': id}, function(err, order) {
		if(err) return next(err)
		if(!order) return res.status(404).end()
		req.order = order 
		next()
	})
})

// router.post('/', function(req, res, next) {
// 	// 1. find if there is an existing cart
// 	// 2. if there is, add to the cart
// 	// 3. if there isn't, add to a new cart
// 	// 4. redirect to same page
// })

module.exports = router;
