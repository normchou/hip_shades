'use strict';
var router = require('express').Router();
var mongoose = require('mongoose')
module.exports = router;

router.use('/:id', function(req, res, next) {
	var productId = req.params.id;
	mongoose.model('User').find({}, function(err, product) {
		res.send({"Object:": "String", "Product": product})
	});
});

