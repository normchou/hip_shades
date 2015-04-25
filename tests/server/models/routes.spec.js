// var mongoose = require('mongoose');
// var User = mongoose.model('User');
//var Products = mongoose.model('Products');
//var Orders = mongoose.model('Order');
//var Reviews = mongoose.model('Reviews');

var supertest = require('supertest');
var app = require('../../../server/app/index.js');
var agent = supertest.agent(app);

describe('http request', function() {
	describe('GET /', function() {
		it('should get 200 on index', function(done) {
			agent
				.get('/')
				.expect(200, done);	
		});
	});
});
