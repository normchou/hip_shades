'use strict';
var router = require('express').Router();
var mongoose = require('mongoose')
var User = mongoose.model('User');

router.use('/', function(req, res, next) {
	res.status(403).end();
});

router.use('/:id/order', require('../order'));

router.get('/:id', function(req, res, next) {
	res.json(req.user)
});

router.param('id', function(req, res, next, id) {
	User.findOne({'_id': id}, function(err, user) {
		if(err) return next(err)
		if(!user) return res.status(404).end()
		req.user = user
		next()
	})
})

module.exports = router;
