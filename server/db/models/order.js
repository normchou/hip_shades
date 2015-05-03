'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var orderSchema = new mongoose.Schema({
    create_date: {
        type: Date,
        default: Date.now
    },
    product_ids: {
        type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Product'}],
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

var Order = mongoose.model('Order', orderSchema);

module.exports = {"Order": Order};
