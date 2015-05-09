/*

This seed file seeds reviews into the database.

*/

var mongoose = require('mongoose');
var connectToDb = require('./../server/db');
var Review = mongoose.model('Review');
var Product = mongoose.model('Product');
var User = mongoose.model('User');
var q = require('q');


var seedReviews = function () {

	var dummyReview = [	

		{ review: 'love em sunglasses', stars: 5 }, 
		{ review: 'runs small', stars: 2 }, 
		{ review: 'great price', stars: 4 },
		{ review: 'i hate them', stars: 1 } 

	];

	var reviews = [];
	
	var productList,
		userList;

	return q.ninvoke(Product, 'find', {})
		.then(function (products) {
			productList = products;
			return q.ninvoke(User, 'find', {});
		}).then(function(users) {
			userList = users;

			for (var i = 0; i < 10; i++) {

				var randomProductIndex = Math.floor(Math.random() * productList.length);
				var randomUserIndex = Math.floor(Math.random() * userList.length);
				var randomReviewIndex = Math.floor(Math.random() * dummyReview.length);

				reviews.push({
					product_id: productList[randomProductIndex]._id,
					user_id: userList[randomUserIndex]._id,
					review: dummyReview[randomReviewIndex].review,
					stars: dummyReview[randomReviewIndex].stars
				});
			}

			return q.invoke(Review, 'create', reviews);
		}).catch(function (err) {
        	console.error(err);
        	process.kill(1);
    	});

}

module.exports = seedReviews;


