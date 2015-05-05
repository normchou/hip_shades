'use strict';
var passport = require('passport');
var _ = require('lodash');
var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
var UserModel = mongoose.model('User');
var Order = mongoose.model('Order');

module.exports = function (app) {

    // When passport.authenticate('local') is used, this function will receive
    // the email and password to run the actual authentication logic.
    var strategyFn = function (email, password, done) {
        UserModel.findOne({ email: email }, function (err, user) {
            if (err) return done(err);
            // user.correctPassword is a method from our UserModel schema.
            if (!user || !user.correctPassword(password)) return done(null, false);
            // Properly authenticated.
            done(null, user);
        });
    };

    passport.use(new LocalStrategy({ usernameField: 'email', passwordField: 'password' }, strategyFn));

    // A POST /login route is created to handle login.
    app.post('/login', function (req, res, next) {

        var authCb = function (err, user) {

            if (err) return next(err);

            if (!user) {
                var error = new Error('Invalid login credentials');
                error.status = 401;
                return next(error);
            }

            // req.logIn will establish our session.
            req.logIn(user, function (err) {
				// console.log('Entered = ', user);

            // merge temp user's and login user's cart -NC
                var cookieId = req.cookies['connect.sid'].match(/[a-zA-Z0-9]+/g)[1];
                
                UserModel.find({email: cookieId + '@temp.com'}, function(err, tempUser) {
                    if (err) {
                        return console.log(err);
                    } else if (tempUser.length > 0) {
                        Order
                            .find({user_id: tempUser[0]._id})
                            .exec(function (err, order) {
                                if (err) return console.log(err);
                                else if (order.length > 0) {
                                    return order[0].product_ids;
                                }
                                return [];
                            })
                            .then(function (tempProducts) {
                                if (err) return console.log(err);
                                if (tempProducts.length === 0) {
                                    console.log('nothing added')
                                }
                                else {
                                    Order
                                        .find({user_id: user._id})
                                        .exec(function (err, order) {
                                            console.log('this is user order', order)
                                            if (err) return console.log(err);
                                            if (order.length === 0) {
                                                var newOrder = new Order ({
                                                    product_ids: tempProducts,
                                                    user_id: user._id
                                                    })
                                                newOrder.save(function(err, newOrder) {
                                                    if (err) return console.error(err);
                                                    console.log('saved cart')             
                                                })
                                            } 
                                            else {  // need to add promise so 
                                                var newProduct = order[0].product_ids
                                                tempProducts[0].product_ids.forEach(function(product) {
                                                    newProduct.push(product);
                                                });
                                                console.log('this is temp', tempProducts[0].product_ids)
                                                Order
                                                    .update({user_id: user._id}, {$set: {product_ids: tempProducts}})
                                                    .exec(function() {
                                                        console.log('successfully updated cart')
                                                    });                    
                                            }
                                        })
                                }
                            })
                            .then(function() {
                                if (tempUser) {
                                    UserModel
                                        .find({user_id: tempUser[0]._id})
                                        .remove()
                                        .exec(function(err, data) {
                                            console.log('temp user removed')
                                        });
                                    Order
                                        .find({user_id: tempUser[0]._id})
                                        .remove()
                                        .exec(function(err, data) {
                                            console.log('temp user order removed')
                                        });
                                }
                            })
                    }
                })



                if (err) return next(err);
                // We respond with a reponse object that has user with _id and email.
                res.status(200).send({ user: _.omit(user.toJSON(), ['password', 'salt']) });
            });

        };

        passport.authenticate('local', authCb)(req, res, next);

    });

};
