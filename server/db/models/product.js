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
};

productSchema.statics.defineQueryObj = function(queryObj) {

	var initialQueryObj = {};
	var secondQueryObj = {};

	if (queryObj.title !== '') {
		initialQueryObj.title = new RegExp('^.*'+queryObj.title+'.*$', "i");
	} 

	// define categories search paramaters (gender should not be included in this array)
	if (typeof queryObj.brands === 'string') {
		initialQueryObj.categories = {"$in": [queryObj.brands]};
	} else if (queryObj.brands) {
		initialQueryObj.categories = {"$in": queryObj.brands};
	}

	// define gender search params. This needs to be filtered later after initial query
	if (queryObj.gender !== '') {
		secondQueryObj.gender = queryObj.gender;
	}

	// define the avgStars search paramaters. This needs to be filtered later after initial query
	if (queryObj.avgStars !== '') {
		secondQueryObj.avgStars = parseInt(queryObj.avgStars);
	} 

	// define price range search params
	queryObj.priceRange = JSON.parse(queryObj.priceRange);
	if (queryObj.priceRange.max !== '') {
		initialQueryObj.price = { $lte: queryObj.priceRange.max };
	}

	if (queryObj.priceRange.min !== '') {
		if (initialQueryObj.price) {
			initialQueryObj.price.$gte = queryObj.priceRange.min;
		} else {
			initialQueryObj.price = { $gte: queryObj.priceRange.min };
		}
	}  

	return {initialQueryObj: initialQueryObj, secondQueryObj: secondQueryObj};

};

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

productSchema.methods.averageStars = function () {
	var that = this;
	return mongoose.model('Review')
		.find({product_id: this._id }).exec()
		.then(function(reviews) {
			var sum = 0;

			reviews.forEach(function(elem) {
				sum += elem.stars;
			});

			var averageStars = sum / reviews.length;

			return {product: that, averageStars: averageStars};
		});
}


var Product = mongoose.model('Product', productSchema);

module.exports = {"Product": Product};
