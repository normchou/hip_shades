'use strict';
var router = require('express').Router();
var mongoose = require('mongoose')
var User = mongoose.model('User');

var amLoggedIn = function(req, res, next) {
	return (typeof(req.user) != "undefined")
}

var isAdmin = function(req, res, next) {
	return (amLoggedIn(req, res, next) && req.user.admin)
}

router.get('/', function(req, res, next) {
	// if (!isAdmin(req, res, next)) res.status(403).send('Thou shalt not pass!');
	// else 
	User.find({}, function(err, users) {
		res.json(users)
	});
});

router.get('/:id', function(req, res, next) {
	if (!amLoggedIn) res.status(403).send('Not logged in')
	res.json(req.userData)
});

router.param('id', function(req, res, next, id) {
	User.findOne({'_id': id}, function(err, user) {
		if(err) return next(err)
		if(!user) return res.status(404).end()
		// if (!isAdmin(req, res, next) && !(user._id.equals(req.id))) {		
		// 	console.log('Admin?=', isAdmin(req, res, next));
		// 	console.log('Are they equal? = ', user._id.equals(req.id))
		// 	return res.status(403).send('Under-priviliged');
		// }
		req.userData = user
		next()
	})
})

router.use('/:id/orders', require('../order'));


module.exports = router;
