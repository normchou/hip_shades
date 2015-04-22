/*

This seed file is only a placeholder. It should be expanded and altered
to fit the development of your application.

It uses the same file the server uses to establish
the database connection:
--- server/db/index.js

The name of the database used is set in your environment files:
--- server/env/*

This seed file has a safety check to see if you already have users
in the database. If you are developing multiple applications with the
fsg scaffolding, keep in mind that fsg always uses the same database
name in the environment files.

Refer to the q documentation for why and how q.invoke is used.

*/

var mongoose = require('mongoose');
var connectToDb = require('./server/db');

var User = mongoose.model('User');
var Product = mongoose.model('Product');
var Review = mongoose.model('Review');
var Order = mongoose.model('Order');

var seedReviews = require('./seed_reviews');
var seedProducts = require('./seed_products');
var seedUsers = require('./seed_users');
var seedOrders = require('./seed_orders');


var q = require('q');
var chalk = require('chalk');


var wipeDB = function () {

    var models = [User, Product, Review];

    models.forEach(function (model) {
        model.find({}).remove(function () {});
    });

    return q.resolve();
};

var seed = function () {

    seedUsers().then(function (users) {
        console.log(chalk.magenta('Seeded Users!'));
        return seedProducts();
    }).then(function(products) {
        console.log(chalk.magenta('Seeded Products!'));
        return seedReviews();
    }).then(function(reviews) {
        console.log(chalk.magenta('Seeded Reviews!'));
        return seedOrders();
    }).then(function(orders) {
        console.log(chalk.magenta('Seeded Orders!'));
        console.log(chalk.green('Seed successful!'));
        process.kill(0);
    }).catch(function (err) {
        console.error(err);
        process.kill(1);
    });

};

mongoose.connection.once('open', function () {
    wipeDB().then(seed);
});