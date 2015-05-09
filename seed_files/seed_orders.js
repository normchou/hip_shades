/*

This seed file seeds orders into the database.

*/

var mongoose = require('mongoose');
var connectToDb = require('./../server/db');
var Order = mongoose.model('Order');
var Product = mongoose.model('Product');
var User = mongoose.model('User');
var q = require('q');

var shuffleArray = function (aRay) {
    for (var i = aRay.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = aRay[i];
        aRay[i] = aRay[j];
        aRay[j] = temp;
    }

    return aRay;
}

var seedOrders = function () {

    // 1-5 random products will be chosen in an order
    var maxProductsInOrder = 4;
    var orders = [];

    var productList,
        userList;

    return q.ninvoke(Product, 'find', {})
        .then(function (products) {
            productList = shuffleArray(products);
            return q.ninvoke(User, 'find', {});
        }).then(function(users) {
            userList = shuffleArray(users);
            // 4 orders will be made, one for the first 4 users
            for (var i = 0; i < 4; i++) {
                var productsInOrder = Math.floor(Math.random() * maxProductsInOrder) + 1;
                var productIDs = [];

                // 1-5 random products in order
                for (var j = 0; j < productsInOrder; j++) {
                    if(productList[j].stock ) {
                        productIDs.push( {  
                                            id: productList[j]._id,
                                            quantity: 1
                                         } );
                    }
                }

                orders.push({
                    products: productIDs,
                    user_id: userList[i]._id
                });
            }

            return q.invoke(Order, 'create', orders);
        }).catch(function (err) {
            console.error(err);
            process.kill(1);
        });

};

module.exports = seedOrders;
