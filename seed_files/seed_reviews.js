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
		{ review: 'Design is wonderful and fits perfectly, lenses are also very good quality which is the main reason I bought them. Very satisfied with these sunglasses! Love em', stars: 5 }, 
		{ review: 'I\'ll be honest in short the glasses are ok. That\'s the honest truth.', stars: 3 }, 
		{ review: 'Great price. Expecially for a \'Hipster\' site', stars: 4 },
		{ review: 'i hate them', stars: 1 },
		{ review: '...meh', stars: 2 },
		{ review: 'Awesome glasses for the price! I was expecting some cheap plastic glasses, which was okay as I only bought these as part of a costume. I was pleasantly surprised when I realized how solid these are. They came with a bag to keep them in, which I didn\'t much care about, but may be nice for some.', stars: 5 },
		{ review: 'I have a pretty average face and these glasses fit well. If you have a wider face, however, I imagine they may be fairly tight and they don\'t have a lot of play in them like the cheaper plastic alternatives.', stars: 4 },  
		{ review: 'Ordered two, got one of a slightly different style; customer service was wonderful.', stars: 4 },
		{ review: 'Too expensive! Buy them for half the price somewhere else', stars: 2 },
		{ review: 'Overall for the money they are very worth it. Will buy again.', stars: 5 },
		{ review: 'I am more than impressed with the quality of these aviator sunglasses. These are a great buy and definitely worth it.', stars: 5 },
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

			for (var i = 0; i < 50; i++) {

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


