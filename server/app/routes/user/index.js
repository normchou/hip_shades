'use strict';
var router = require('express').Router();
var mongoose = require('mongoose')
var User = mongoose.model('User');
var Order = mongoose.model('Order');

router.use('/:id/orders', require('../order'));


var amLoggedIn = function(req, res, next) {
	return (typeof(req.user) != "undefined")
}

var isAdmin = function(req, res, next) {
	return (!amLoggedIn(req, res, next) && req.user.admin)
}

router.get('/', function(req, res, next) {
	if (isAdmin(req, res, next)) {
		res.status(403).send('Thou shalt not pass!');
	} else {
			User.find({}, function(err, users) {
			res.json(users)
		});
	}
});

//route to post a new user. Called from SignIn form -VA 5/2/15
router.post('/', function(req, res, next) {
	req.body.street += ' ' + req.body.street2; 

	User.create(req.body, function(err, newUser) {
		if (err) return next(err);
		req.login(newUser, function(err) {
			if(err) return next(err)
			res.json(newUser);
		})
	});
});

// route to update user -NC 5/2/15
router.put('/', function(req, res, next) {
	var editUser = req.body;

	if(editUser._id === undefined) {
		var newUser = new User(editUser);
		newUser.save()
		res.send("successfully saved")
	} else {
		User.update({_id: editUser._id}, { $set: editUser }, function(err) {
			if (err) return handleError(err);
			res.send('successfully updated')
		})
	}
})

// route to remove a user -NC 5/2/15
router.delete('/', function(req, res, next) {
	var removeUser = req.body;

	console.log('this is the body', req.body)
})



// this route gets the current logged in user and find the orders for the user
router.get('/currentuser/', function(req, res, next) {

	var cookieId = req.cookies['connect.sid'].match(/[a-zA-Z0-9]+/g)[1];

	User.find({email: cookieId + '@temp.com'}, function(err, data) {
		if (err) {
			return console.log(err);
		} else if (data.length === 0) {
			res.json('undefined')
		} else {
			Order
				.find({user_id: data[0]._id})
				.populate('product_ids')
				.exec(function(err, order) {
				if (err) return console.log(err);
				res.json(order);
			});
		}
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
		//  	console.log('Admin?=', isAdmin(req, res, next));
		//  	console.log('Are they equal? = ', user._id.equals(req.id))
		//  	return res.status(403).send('Under-priviliged');
		// }
		req.userData = user
		next()
	})
})

module.exports = router;
