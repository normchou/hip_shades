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
var q = require('q');

var productSchema = new mongoose.Schema({
	title: {
		type: String,
		required: true
	},
	description: {
		type: String
	},
	price: {
		type: Number, // remember to store as cents because of binary arithmatic
		required: true,
		min: 1,
		default: 1
	},
	categories: {
		type: [String]
	},
	imageURL: {
		type: [String]
	},
	stock: {
		type: Number,
		required: true,
		default: 25
	}
});

productSchema.methods.getReviews = function() {
	return mongoose.model('Review')
				.find({product_id: this._id })
				.populate('user_id')
				.exec();
}

productSchema.statics.getByCategory = function(cat) {
	return this.find({categories: {"$in": [cat]}}).exec();
}

// grabs all categories, but very inneficent. Will have to make a category
// model & collection later.
productSchema.statics.getAllCategories = function() {
	return q.ninvoke(Product, 'find', {}).then(function(products) {
		var categories = [];
		products.forEach(function(element) {

			element.categories.forEach(function(category) {
				if (categories.indexOf(category) === -1) {
					categories.push(category);
				}
			});

		});

		return categories;
	});
}

var Product = mongoose.model('Product', productSchema);

module.exports = {"Product": Product};
