/// what to test
/*
 - all model validations
 - methods
 - statics
 - hooks
 - virtuals
*/


'use strict';
var mongoose = require('mongoose');

var productSchema = new mongoose.Schema({
	title: {
		type: String,
		required: true
	},
	description: {
		type: String,
		required: true
	},
	price: {
		type: Number, // remember to store as cents because of binary arithmatic
		required: true
	},
	category: {
		type: [String],
		required: true
	},
	imageURL: {
		type: [String]
	},
	stock: {
		type: Number
	}
});

// productSchema.virtual('dollarPrice').get(function() {
// 	return this.price / 100
// })

productSchema.methods.getReviews = function() {
	return mongoose.model('Review').find({ productID: this._id }).exec();
}

var Product = mongoose.model('Product', productSchema);

module.exports = {"Product": Product};
