'use strict';
var mongoose = require('mongoose');

var reviewSchema = new mongoose.Schema({
	product_id: {
		type: mongoose.Schema.Types.ObjectId, ref: 'Product'
	},
	user_id: {
		type: mongoose.Schema.Types.ObjectId, ref: 'User'
	},
	review: {
		type: String,
		minlength: 3
	},
	stars: {
		type: Number,
		min: 1,
		max: 5 
	}
});

var Review = mongoose.model('Review', reviewSchema);

module.exports = {"Review": Review};
