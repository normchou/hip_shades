/*

This seed file seeds reviews into the database.

*/

var mongoose = require('mongoose');
var connectToDb = require('./server/db');
var Review = mongoose.model('Review');
var Product = mongoose.model('Product');
var User = mongoose.model('User');
var q = require('q');


var seedReviews = function () {

	var dummyDescription = [	

		{ description: 'love em sunglasses', stars: 5 }, 
		{ description: 'runs small', stars: 2 }, 
		{ description: 'great price', stars: 4 },
		{ description: 'i hate them', stars: 1 } 

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
				var randonDescriptionIndex = Math.floor(Math.random() * dummyDescription.length);

				reviews.push({
					productID: productList[randomProductIndex]._id,
					userID: userList[randomUserIndex]._id,
					description: dummyDescription[randonDescriptionIndex].description,
					stars: dummyDescription[randonDescriptionIndex].stars
				});
			}

			return q.invoke(Review, 'create', reviews);
		}).catch(function (err) {
        	console.error(err);
        	process.kill(1);
    	});

}

module.exports = seedReviews;


