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

// This merges temp user's and login user's cart -NC
                var cookieId = req.cookies['connect.sid'].match(/[a-zA-Z0-9]+/g)[1];
// Find temp user
                UserModel.find({email: cookieId + '@temp.com'}, function(err, tempUser) {
                    if (err) {
                        return console.log(err);
                    } 
// No temp user found and no merging of carts is needed. User would proceed to login.
                    else if (tempUser.length === 0) {
                        return console.log('successfully login with no temp user defined');
                    } 
// A temp user does exist and more logic is needed to determine how to deal with their cart items.
                    else {
// Check if the temp user has any items in their cart.                        
                        Order
                            .find({user_id: tempUser[0]._id, checked_out: false})   
                            .exec(function (err, order) {
                                if (err) {
                                    return console.log(err);
                                }
// If there are no items in the temp user's cart. Remove the temp user.
                                else if (order.length < 1) {
                                    UserModel
                                        .find({user_id: tempUser[0]._id})
                                        .remove()
                                        .exec(function(err, data) {
                                            console.log('temp user removed')
                                        });
                                    return [];
                                }
// If the temp user's cart has items do the following.                                
                                else if (order.length > 0) {
                                    return order[0].products;    
                                }  
                            })
                            .then(function (tempProducts) {
                                if (err) return console.log(err);
// Not sure if this is needed.
                                if (tempProducts.length === 0) {
                                    console.log('nothing added')
                                    UserModel
                                        .find({user_id: tempUser[0]._id})
                                        .remove()
                                        .exec(function(err, data) {
                                            console.log('temp user removed')
                                        });  
                                    Order
                                        .find({user_id: tempUser[0]._id})
                                        .remove()
                                        .exec(function() {
                                            console.log('temp user cart removed')
                                        });    
                                }
// Find the cart of the login user and see if there are any items in the cart.
                                else {
                                    Order
                                        .find({user_id: user._id})
                                        .exec(function (err, order) {
                                            if (err) return console.log(err);

console.log('temp products', tempProducts)
console.log('orders', order)

                                            var newProduct = order[0].products
                                            tempProducts[0].products.forEach(function(product) {
                                                    newProduct.push(product);
                                                });
// If there are no items in the cart, add the temp user's items into the cart
                                            if (order.length === 0) {
                                                var newOrder = new Order ({
                                                    products: tempProducts,
                                                    user_id: user._id
                                                    })
                                                newOrder.save(function(err, newOrder) {
                                                    if (err) return console.error(err);
                                                    console.log('saved cart')             
                                                })
                                            } 
// If the user has items in the cart, merge the two carts.
                                            else {  
                                                Order
                                                    .update({user_id: user._id, checked_out: false}, {$set: {products: newProduct}})
                                                    .exec(function(product) {
                                                        console.log('successfully updated cart', product)
                                                    });
                                                UserModel
                                                    .find({user_id: tempUser[0]._id})
                                                    .remove()
                                                    .exec(function(err, data) {
                                                        console.log('temp user removed')
                                                    });  
                                                Order
                                                    .find({user_id: tempUser[0]._id})
                                                    .remove()
                                                    .exec(function() {
                                                        console.log('temp user cart removed')
                                                    });                                  
                                            }
                                        })
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
