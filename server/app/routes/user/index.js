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
	return (amLoggedIn(req, res, next) && req.user.admin)
}

router.get('/', function(req, res, next) {
	if (!isAdmin(req, res, next)) {
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
router.delete('/:id', function(req, res, next) {
	User.findOneAndRemove({_id: req.params.id}, function(err, user) {
		if(err) return console.log(err);
		console.log('removed this user', user)
	})
	res.send('successfully deleted')
})

// this route gets the current logged in user and find the orders for the user to show in cart -NC
router.get('/currentuser/', function(req, res, next) {
	if (typeof (req.user) != "undefined") {
		Order
			.find({user_id: req.user._id})
			.populate('product_ids')
			.exec(function (err, order) {
				if (err) return console.log(err);
				res.json(order)
			})
	} else {
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
	}
});

router.get('/:id', function(req, res, next) {
	if (!amLoggedIn) res.status(403).send('Not logged in')
	res.json(req.userData)
});


router.param('id', function(req, res, next, id) {
	User.findOne({'_id': id}, function(err, user) {
		if(err) return next(err)
		if(!user) return res.status(404).end()
		if (!isAdmin(req, res, next) && !(user._id.equals(req.user.id))) {		
		  	console.log('Admin?=', isAdmin(req, res, next));
		  	console.log('Are they equal? = ', user._id.equals(req.user.id))
		  	console.log('user._id = ', user._id);
		  	console.log('req.user.id = ', req.user.id);
		  	return res.status(403).send('Under-priviliged');
		}
		req.userData = user
		next()
	})
})

router.use('/:id/orders', require('../order'));

router.use('/:id/allOrders', function(req, res, next) {
	if (!isAdmin(req, res, next)) return res.status(404).end()

	Order.find({}).populate('user_id').exec(function (err, orders) {
		res.json(orders)
	})
})

module.exports = router;
