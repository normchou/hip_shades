'use strict';
var router = require('express').Router();
var mongoose = require('mongoose')
var Order = mongoose.model('Order');

router.get('/', function(req, res, next) {
	req.user.getOrders()
		.then(function(data) {
			res.send(data);
		});
});

router.get('/:id', function(req, res, next) {
	res.send(req.order);	
});

router.param('id', function(req, res, next, id) {
	Order.findOne({'_id': id}, function(err, order) {
		if(err) return next(err)
		if(!order) return res.status(404).end()
		req.order = order 
		next()
	})
})

module.exports = router;
