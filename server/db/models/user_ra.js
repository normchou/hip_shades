'use strict';
var mongoose = require('mongoose');

var schema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    first_name:{
        type: String,
        required: true
    },
    last_name:{
        type: String,
        required: true
    },
    admin:{
        type: Boolean,
        required: true,
        default: false
    },
    street:{
        type: String,
        required: false
    },
    state:{
        type: String, //This will be drop-down. To be updated in the future.
        required: false //Required if your country is US
    },
    country:{
        type: String, //This will be drop-down.
        default: 'US',
        required: false
    },
    order_history:[{
        type: Schema.types.ObjectId,
        ref: 'Orders',
        required: false
    }]
});

var Users = mongoose.model('Users', schema);

module.exports = {"Users": Users};
