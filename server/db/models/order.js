'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var orderSchema = new mongoose.Schema({
    create_date: {
        type: Date,
        default: Date.now
    },
    products: [{ 
                id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
                quantity: { type: Number, default: 1 }
    }],
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    checked_out: {
        type: String,
        required: true,
        default: false
    },
    checkout_price: {
        type: Number
    }
});

orderSchema.methods.getUser = function(cb) {
	return this.populate('user_id', function(err, orderWithUser){
		cb(err, orderWithUser)
	})
}

orderSchema.methods.addProductToOrder = function(productId) {
    var inCart = false;

    this.products.forEach( function(elem, index) {
        if (elem.id.equals(productId)) {
            elem.quantity++;
            inCart = true;
        }
    });

    if (!inCart) {
        this.products.push({    
            id: productId,
            quantity: 1
        });
    }
    return Order.update({user_id: this.user_id}, {$set: {products: this.products}}).exec();
}

var Order = mongoose.model('Order', orderSchema);

module.exports = {"Order": Order};
