var mongoose = require('mongoose');
var User = mongoose.model('User');
var Products = mongoose.model('Products');
var Orders = mongoose.model('Order');
var Reviews = mongoose.model('Reviews');

var supertest = require('supertest');
var app = require('../../../server/app/index.js');
var agent = supertest.agent(app);

var mongoose = require('mongoose');
var dbURI = 'mongodb://localhost:27017/testingDB';
var clearDB = require('mocha-mongoose')(dbURI);


describe('http request', function() {

	beforeEach('Establish DB connection', function (done) {
	    if (mongoose.connection.db) return done();
	    mongoose.connect(dbURI, done);
	});

	afterEach('Clear test database', function (done) {
	    clearDB(done);
	});

	describe('GET /', function() {
		it('should get 200 on index', function(done) {
			agent
				.get('/')
				.expect(200, done);	
		});
	});
});
