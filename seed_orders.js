/*

This seed file seeds orders into the database.

*/

var mongoose = require('mongoose');
var connectToDb = require('./server/db');
var Order = mongoose.model('Order');
var Product = mongoose.model('Product');
var User = mongoose.model('User');
var q = require('q');

var seedOrders = function () {

    // 1-5 random products will be chosen in an order
    var maxProductsInOrder = 5;
    var orders = [];

    var productList,
        userList;

    return q.ninvoke(Product, 'find', {})
        .then(function (products) {
            productList = products;
            return q.ninvoke(User, 'find', {});
        }).then(function(users) {
            userList = users;

            for (var i = 0; i < 5; i++) {
                var productsInOrder = Math.floor(Math.random() * maxProductsInOrder) + 1;
                var productIDs = [];

                for (var j = 0; j < productsInOrder; j++) {
                    var productIndex = Math.floor(Math.random() * productList.length);
                    if(productList[productIndex].stock )
                        productIDs.push( productList[productIndex]._id );
                }

                var randomUserIndex = Math.floor(Math.random() * userList.length);

                orders.push({
                    product_list: productIDs,
                    user_ref: userList[randomUserIndex]._id,
                    checked_out: Math.random() < 0.5 ? true : false
                });
            }

            return q.invoke(Order, 'create', orders);
        }).catch(function (err) {
            console.error(err);
            process.kill(1);
        });

};

module.exports = seedOrders;