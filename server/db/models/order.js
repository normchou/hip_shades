'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var orderSchema = new mongoose.Schema({
    create_date: {
        type: Date,
        default: Date.now
    },
    product_list: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    }],
    user_ref: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    checked_out: {
        type: Boolean,
        required: true,
        default: false
    }
});

var Order = mongoose.model('Order', orderSchema);

module.exports = {"Order": Order};
