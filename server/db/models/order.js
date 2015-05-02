'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var q = require('q');

var orderSchema = new mongoose.Schema({
    create_date: {
        type: Date,
        default: Date.now
    },
    product_ids: {
        type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Product'}],
        required: true
    },
    user_id: {
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

orderSchema.methods.calculatePrice = function() {
    return mongoose.model('Product').find({
        '_id': { $in: this.product_id}
    }, function(err, docs){
         console.log(docs);
    });
}

orderSchema.methods.getUser = function(cb) {
	return this.populate('user_id', function(err, orderWithUser){
		cb(err, orderWithUser)
	})
}

var Order = mongoose.model('Order', orderSchema);

module.exports = {"Order": Order};
