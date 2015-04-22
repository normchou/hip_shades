/*

This seed file seeds orders into the database.

*/

var mongoose = require('mongoose');
var connectToDb = require('./server/db');
var Order = mongoose.model('Order');
var q = require('q');

var seedOrders = function () {

    var orders = [

    ];

    return q.invoke(Order, 'create', orders);

};

module.exports = seedOrders;