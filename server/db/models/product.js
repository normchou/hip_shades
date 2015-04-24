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
var Promise = require('q');

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
	return mongoose.model('Review').find({productID: this._id }).exec();
}

productSchema.statics.getByCategory = function(cat) {
	return mongoose.model('Product').find({category: {"$in": [cat]}}).exec();
}

productSchema.statics.getAllCategories = function() {
	return ['Prada', 'Ray-Ban', 'Oakley', 'men', 'women'];
//	return new Promise(function(resolve, reject) {
//		mongoose.model('Product').find({}, function (products) {
//			resolve(products);
//		});
//	})
}

var Product = mongoose.model('Product', productSchema);

module.exports = {"Product": Product};
