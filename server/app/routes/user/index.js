'use strict';
var router = require('express').Router();
var mongoose = require('mongoose')
var User = mongoose.model('User');
var Order = mongoose.model('Order');
var Utils = require('../common/');
var isAdmin = Utils.isAdmin;
var needAdminPrivileges = Utils.needAdminPrivileges;
var needUserLoggedIn = Utils.needUserLoggedIn;

router.use('/:id/orders', require('../order'));

router.get('/', needAdminPrivileges, function(req, res, next) {
	User.find({}, function(err, users) {
		res.json(users)
	})
});

//route to post a new user. Called from SignIn form -VA 5/2/15
router.post('/', function(req, res, next) {
	req.body.street += ' ' + req.body.street2; 

// check if there is a temp user created -NC 5/5/15
	var cookieId = req.cookies['connect.sid'].match(/[a-zA-Z0-9]+/g)[1];

	User.find({email: cookieId + '@temp.com'}, function(err, tempUser) {
		if (err) {
			return console.log(err);
		} else if (tempUser.length === 0) {
			User.create(req.body, function(err, newUser) {
				if (err) return next(err);
				req.login(newUser, function(err) {
					if(err) return next(err)
					res.json(newUser);
				})
			});
		} else {
			// update the the temp user info with sign up user info
			User
				.findByIdAndUpdate(tempUser[0]._id, {$set: req.body}, function (err, tempUser) {
					if (err) return console.log(err);
					req.login(tempUser, function(user) {
						res.json(user);
					})
				})		
			};
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
router.delete('/:id', needAdminPrivileges, function(req, res, next) {
	User.findOneAndRemove({_id: req.params.id}, function(err, user) {
		if(err) return console.log(err);
		console.log('removed this user', user)
	})
	res.send('successfully deleted')
})

// this route gets the current logged in user and find the orders for the user to show in cart -NC
router.get('/currentuser/', function(req, res, next) {
	console.log('this is the user', req.user)
	if (typeof (req.user) !== "undefined") {
		Order
			.find({user_id: req.user._id})
			.populate('products.id')
			.exec(function (err, order) {
				if (err) return console.log(err);
				res.json(order)
			})
	} else {
		var cookieId = req.cookies['connect.sid'].match(/[a-zA-Z0-9]+/g)[1];

		User.findOne({email: cookieId + '@temp.com'}, function(err, tempUser) {
			if (err) {
				return console.log(err);
			} else if (!tempUser) {
				res.json(null)
			} else {
				Order
					.find({user_id: tempUser._id})
					.populate('products.id')
					.exec(function(err, order) {
					if (err) return console.log(err);
					res.json(order);
				});
			}
		});	
	}
});

router.get('/:id', needUserLoggedIn, function(req, res, next) {
	res.json(req.user)
});


router.use('/:id/allAdminOrders', needAdminPrivileges, function(req, res, next) {	// made change here to /:id/allAdminOrders
	Order.find({}).populate('user_id').exec(function (err, orders) {
		res.json(orders)
	})
})

router.use('/:id/allOrders', needUserLoggedIn, function(req, res, next) {	// added this 
	Order.find({}).populate('user_id').exec(function (err, orders) {
		res.json(orders)
	})
})

router.param('id', function(req, res, next, id) {
	User.findOne({'_id': id}, function(err, user) {
		console.log("user - ", user);
		console.log("req.user", req.user);

		if(err) return next(err)
		// I commented this out because currently this code dosent not work when 
		// temp users want to change the quantity in thier cart.

		// if(!user) return res.status(404).send('No user found with the given credentials.')
		// if (!isAdmin(req, res, next) && !(user._id.equals(req.user._id))) {		
		//   	console.log('Admin?=', isAdmin(req, res, next))
		//   	console.log('Are they equal? = ', user._id.equals(req.user.id))
		//   	return res.status(403).send('Under-priviliged')
		// }
		req.user = user
		next()
	})
})

module.exports = router;
