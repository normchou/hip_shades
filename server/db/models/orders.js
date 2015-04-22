'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema;
schema = new mongoose.Schema({
    create_date: {
        type: Date,
        default: Date.now
    },
    product_list: [{
        type: Schema.types.ObjectId,
        ref: 'Products',
        required: true
    }],
    user_ref: {
        type: Schema.types.ObjectId,
        ref: 'Users',
        required: false
    },
    checked_out: {
        type: Boolean,
        required: true,
        default: false
    }
});

var Orders = mongoose.model('Orders', schema);

module.exports = {"Orders": Orders};
